package com.kidscolour.service;

import com.kidscolour.exception.ResourceNotFoundException;
import com.kidscolour.model.Book;
import com.kidscolour.model.BookGrant;
import com.kidscolour.model.User;
import com.kidscolour.model.enums.UserRole;
import com.kidscolour.repository.BookGrantRepository;
import com.kidscolour.repository.BookRepository;
import com.kidscolour.repository.OrderItemRepository;
import com.kidscolour.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * The single rule for "may this customer open this book?".
 *
 * A book unlocks when it is FREE, was PURCHASED, was GRANTED by an admin, or
 * the viewer is an ADMIN. Reading, colouring and downloading all defer to this,
 * so access can never drift between features.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BookAccessService {

    public enum Reason { FREE, PURCHASED, GRANTED, ADMIN, NONE }

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;
    private final BookGrantRepository bookGrantRepository;

    @Transactional(readOnly = true)
    public Reason accessReason(String email, Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        if (Boolean.TRUE.equals(book.getIsFree())) return Reason.FREE;

        // Anonymous visitors only ever get free books.
        if (email == null) return Reason.NONE;

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return Reason.NONE;

        if (user.getRole() == UserRole.ADMIN) return Reason.ADMIN;
        if (orderItemRepository.existsByOrder_User_IdAndBook_Id(user.getId(), bookId)) return Reason.PURCHASED;
        if (bookGrantRepository.existsByUser_IdAndBook_Id(user.getId(), bookId)) return Reason.GRANTED;
        return Reason.NONE;
    }

    public boolean hasAccess(String email, Long bookId) {
        return accessReason(email, bookId) != Reason.NONE;
    }

    // ---- admin: gifting ----

    @Transactional
    public BookGrant grant(Long userId, Long bookId, String grantedByEmail, String note) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        if (bookGrantRepository.existsByUser_IdAndBook_Id(userId, bookId)) {
            throw new IllegalArgumentException(user.getName() + " already has free access to \"" + book.getName() + "\".");
        }
        log.info("Admin {} granted book {} to user {}", grantedByEmail, bookId, userId);
        return bookGrantRepository.save(BookGrant.builder()
                .user(user).book(book).grantedBy(grantedByEmail).note(note).build());
    }

    @Transactional
    public void revoke(Long grantId) {
        BookGrant grant = bookGrantRepository.findById(grantId)
                .orElseThrow(() -> new ResourceNotFoundException("Grant not found with id: " + grantId));
        bookGrantRepository.delete(grant);
    }

    @Transactional(readOnly = true)
    public List<BookGrant> listAll() {
        return bookGrantRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<BookGrant> listForUser(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        return user == null ? List.of() : bookGrantRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
    }
}
