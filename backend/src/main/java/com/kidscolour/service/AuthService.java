package com.kidscolour.service;

import com.kidscolour.dto.request.*;
import com.kidscolour.dto.response.AuthResponse;
import com.kidscolour.dto.response.UserResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse googleAuth(GoogleAuthRequest request);
    /** Exchange a valid refresh token for a fresh access token. */
    AuthResponse refreshToken(RefreshTokenRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
    UserResponse getCurrentUser(String email);
    UserResponse updateProfile(String email, UpdateProfileRequest request);
}
