package com.kidscolour.controller;

import com.kidscolour.dto.response.ApiResponse;
import com.kidscolour.dto.response.BookGrantResponse;
import com.kidscolour.model.BookGrant;
import com.kidscolour.service.BookAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Lets the browser ask "can I open this book?" before showing the
 * Colouring Studio or Story Reader.
 */
@RestController
@RequestMapping("/api/access")
@RequiredArgsConstructor
public class BookAccessController {

    private final BookAccessService accessService;

    /** Public: anonymous callers simply get FREE-or-nothing. */
    @GetMapping("/books/{bookId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> check(
            Authentication authentication,
            @PathVariable Long bookId) {
        String email = authentication != null ? authentication.getName() : null;
        BookAccessService.Reason reason = accessService.accessReason(email, bookId);
        return ResponseEntity.ok(ApiResponse.success("ok", Map.of(
                "hasAccess", reason != BookAccessService.Reason.NONE,
                "reason", reason.name(),
                "loggedIn", email != null
        )));
    }

    /** Books an admin has gifted to the signed-in customer. */
    @GetMapping("/my-grants")
    public ResponseEntity<ApiResponse<List<BookGrantResponse>>> myGrants(Authentication authentication) {
        List<BookGrantResponse> grants = accessService.listForUser(authentication.getName())
                .stream().map(BookAccessController::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success("Grants fetched", grants));
    }

    static BookGrantResponse toResponse(BookGrant g) {
        return BookGrantResponse.builder()
                .id(g.getId())
                .userId(g.getUser().getId())
                .userName(g.getUser().getName())
                .userEmail(g.getUser().getEmail())
                .bookId(g.getBook().getId())
                .bookName(g.getBook().getName())
                .bookType(g.getBook().getBookType() != null ? g.getBook().getBookType().name() : "COLOURING")
                .grantedBy(g.getGrantedBy())
                .note(g.getNote())
                .createdAt(g.getCreatedAt())
                .build();
    }
}
