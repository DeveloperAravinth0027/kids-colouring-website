package com.kidscolour.service;

import com.kidscolour.dto.request.AdminUserRequest;
import com.kidscolour.dto.response.UserResponse;
import com.kidscolour.exception.ResourceNotFoundException;
import com.kidscolour.model.User;
import com.kidscolour.model.enums.AuthProvider;
import com.kidscolour.model.enums.UserRole;
import com.kidscolour.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Admin-side user management.
 *
 * Note: passwords are one-way bcrypt hashes — they can never be read back or
 * displayed. An admin can only SET a new one.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserResponse> list() {
        return userRepository.findAll().stream().map(this::map).toList();
    }

    @Transactional
    public UserResponse create(AdminUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("That email is already registered.");
        }
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(parseRole(request.getRole()))
                .provider(AuthProvider.LOCAL)
                .isActive(true)
                .emailVerified(true) // created by an admin, so treat as verified
                .build();
        log.info("Admin created user {} ({})", user.getEmail(), user.getRole());
        return map(userRepository.save(user));
    }

    @Transactional
    public UserResponse setRole(Long id, String role) {
        User user = require(id);
        user.setRole(parseRole(role));
        return map(userRepository.save(user));
    }

    /** Admins can reset a password, never read the existing one. */
    @Transactional
    public void setPassword(Long id, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        User user = require(id);
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Admin reset the password for {}", user.getEmail());
    }

    @Transactional
    public void delete(Long id) {
        userRepository.delete(require(id));
    }

    private User require(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private UserRole parseRole(String role) {
        try {
            return UserRole.valueOf(String.valueOf(role).toUpperCase());
        } catch (Exception e) {
            return UserRole.CUSTOMER;
        }
    }

    private UserResponse map(User u) {
        UserResponse r = new UserResponse();
        r.setId(u.getId());
        r.setName(u.getName());
        r.setEmail(u.getEmail());
        r.setPhone(u.getPhone());
        r.setRole(u.getRole() != null ? u.getRole().name() : "CUSTOMER");
        r.setProvider(u.getProvider() != null ? u.getProvider().name() : "LOCAL");
        r.setAvatarUrl(u.getAvatarUrl());
        return r;
    }
}
