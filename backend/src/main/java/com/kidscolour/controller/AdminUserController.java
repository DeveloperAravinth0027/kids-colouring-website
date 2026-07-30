package com.kidscolour.controller;

import com.kidscolour.dto.request.AdminUserRequest;
import com.kidscolour.dto.response.ApiResponse;
import com.kidscolour.dto.response.UserResponse;
import com.kidscolour.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success("Users fetched successfully", adminUserService.list()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody AdminUserRequest request) {
        return ResponseEntity.ok(ApiResponse.success("User created", adminUserService.create(request)));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> setRole(@PathVariable Long id, @RequestParam String role) {
        return ResponseEntity.ok(ApiResponse.success("Role updated", adminUserService.setRole(id, role)));
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<ApiResponse<Void>> setPassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        adminUserService.setPassword(id, body.get("password"));
        return ResponseEntity.ok(ApiResponse.success("Password updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        adminUserService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted"));
    }
}
