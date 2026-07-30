package com.kidscolour.service.impl;

import com.kidscolour.dto.request.*;
import com.kidscolour.dto.response.AuthResponse;
import com.kidscolour.dto.response.UserResponse;
import com.kidscolour.exception.ResourceNotFoundException;
import com.kidscolour.exception.UnauthorizedException;
import com.kidscolour.model.User;
import com.kidscolour.model.enums.AuthProvider;
import com.kidscolour.model.enums.UserRole;
import com.kidscolour.repository.UserRepository;
import com.kidscolour.security.JwtTokenProvider;
import com.kidscolour.service.AuthService;
import com.kidscolour.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final com.kidscolour.security.LoginAttemptService loginAttemptService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.google.token-info-url}")
    private String googleTokenInfoUrl;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use!");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(UserRole.CUSTOMER)
                .provider(AuthProvider.LOCAL)
                .isActive(true)
                .emailVerified(false)
                .build();

        userRepository.save(user);

        // Authenticate the new user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateToken(authentication);
        String refresh = jwtTokenProvider.generateRefreshToken(authentication);

        return AuthResponse.builder()
                .token(jwt)
                .refreshToken(refresh)
                .user(mapToUserResponse(user))
                .build();
    }

    /**
     * Silent re-auth: the access token is short-lived (15 min), so the client
     * swaps its long-lived refresh token for a fresh one instead of forcing the
     * customer to log in again.
     */
    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        if (!jwtTokenProvider.validateJwtToken(refreshToken)) {
            throw new UnauthorizedException("Session expired. Please log in again.");
        }

        String email = jwtTokenProvider.getEmailFromJwtToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Session expired. Please log in again."));
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new UnauthorizedException("This account is disabled.");
        }

        String newAccessToken = jwtTokenProvider.generateTokenFromEmail(
                email, "ROLE_" + user.getRole().name());

        return AuthResponse.builder()
                .token(newAccessToken)
                .refreshToken(refreshToken) // still valid; reuse until it expires
                .user(mapToUserResponse(user))
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        // Refuse early if this account is temporarily locked by repeated failures.
        if (loginAttemptService.isLocked(request.getEmail())) {
            log.warn("Blocked login attempt on locked account {}", request.getEmail());
            throw new UnauthorizedException("Too many failed attempts. Please try again in "
                    + loginAttemptService.lockMinutes() + " minutes.");
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (org.springframework.security.core.AuthenticationException e) {
            loginAttemptService.recordFailure(request.getEmail());
            // Deliberately vague: revealing whether the email exists would let an
            // attacker enumerate valid accounts.
            throw new UnauthorizedException("Invalid email or password");
        }

        loginAttemptService.reset(request.getEmail());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateToken(authentication);
        String refresh = jwtTokenProvider.generateRefreshToken(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return AuthResponse.builder()
                .token(jwt)
                .refreshToken(refresh)
                .user(mapToUserResponse(user))
                .build();
    }

    @Override
    public AuthResponse googleAuth(GoogleAuthRequest request) {
        try {
            // Verify token with Google
            String url = googleTokenInfoUrl + "?id_token=" + request.getToken();
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> payload = response.getBody();
                String email = (String) payload.get("email");
                String name = (String) payload.get("name");
                String googleId = (String) payload.get("sub");
                String picture = (String) payload.get("picture");
                
                // Find or create user
                User user = userRepository.findByEmail(email).orElse(null);
                
                if (user == null) {
                    user = User.builder()
                            .name(name)
                            .email(email)
                            .provider(AuthProvider.GOOGLE)
                            .providerId(googleId)
                            .avatarUrl(picture)
                            .role(UserRole.CUSTOMER)
                            .isActive(true)
                            .emailVerified(true) // Google emails are verified
                            .build();
                            
                    user = userRepository.save(user);
                } else if (user.getProvider() == AuthProvider.LOCAL) {
                    // Update to link Google account
                    user.setProvider(AuthProvider.GOOGLE);
                    user.setProviderId(googleId);
                    if (user.getAvatarUrl() == null) {
                        user.setAvatarUrl(picture);
                    }
                    user.setEmailVerified(true);
                    user = userRepository.save(user);
                }
                
                // Generate tokens manually since we bypass AuthenticationManager
                String jwt = jwtTokenProvider.generateTokenFromEmail(user.getEmail(), "ROLE_" + user.getRole().name());
                String refresh = jwtTokenProvider.generateTokenFromEmail(user.getEmail(), "ROLE_" + user.getRole().name()); // Should have a proper refresh method in provider
                
                return AuthResponse.builder()
                        .token(jwt)
                        .refreshToken(refresh)
                        .user(mapToUserResponse(user))
                        .build();
            } else {
                throw new UnauthorizedException("Invalid Google token");
            }
        } catch (Exception e) {
            log.error("Google auth failed", e);
            throw new UnauthorizedException("Google authentication failed");
        }
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);
            
            emailService.sendPasswordReset(user.getEmail(), token);
        });
        // We always return success even if email not found for security reasons
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));
                
        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reset token has expired");
        }
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    @Override
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToUserResponse(user);
    }

    @Override
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        user.setName(request.getName());
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        
        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }
    
    private UserResponse mapToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRole(user.getRole().name());
        response.setProvider(user.getProvider().name());
        response.setAvatarUrl(user.getAvatarUrl());
        return response;
    }
}
