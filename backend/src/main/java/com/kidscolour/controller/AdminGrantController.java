package com.kidscolour.controller;

import com.kidscolour.dto.response.ApiResponse;
import com.kidscolour.dto.response.BookGrantResponse;
import com.kidscolour.service.BookAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Admin: give a specific customer a book for free. */
@RestController
@RequestMapping("/api/admin/grants")
@RequiredArgsConstructor
public class AdminGrantController {

    private final BookAccessService accessService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookGrantResponse>>> list() {
        List<BookGrantResponse> grants = accessService.listAll()
                .stream().map(BookAccessController::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success("Grants fetched", grants));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BookGrantResponse>> grant(
            Authentication authentication,
            @RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(String.valueOf(body.get("userId")));
        Long bookId = Long.valueOf(String.valueOf(body.get("bookId")));
        String note = body.get("note") != null ? String.valueOf(body.get("note")) : null;

        BookGrantResponse created = BookAccessController.toResponse(
                accessService.grant(userId, bookId, authentication.getName(), note));
        return ResponseEntity.ok(ApiResponse.success("Free access granted", created));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> revoke(@PathVariable Long id) {
        accessService.revoke(id);
        return ResponseEntity.ok(ApiResponse.success("Free access removed"));
    }
}
