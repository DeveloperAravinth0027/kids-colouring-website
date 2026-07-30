package com.kidscolour.service;

import com.kidscolour.dto.request.BookRequest;
import com.kidscolour.dto.response.BookListResponse;
import com.kidscolour.dto.response.BookResponse;
import com.kidscolour.dto.response.PagedResponse;
import org.springframework.web.multipart.MultipartFile;

public interface BookService {
    PagedResponse<BookListResponse> getAllBooks(int page, int size);
    PagedResponse<BookListResponse> getFeaturedBooks(int page, int size);
    PagedResponse<BookListResponse> getFreeBooks(int page, int size);
    PagedResponse<BookListResponse> getBooksByCategory(Long categoryId, int page, int size);
    PagedResponse<BookListResponse> searchBooks(String query, int page, int size);
    
    BookResponse getBookBySlug(String slug);
    BookResponse getBookById(Long id);
    
    BookResponse createBook(BookRequest request);
    BookResponse updateBook(Long id, BookRequest request);
    /** Deletes an unsold book, archives a sold one. Returns what happened. */
    String deleteBook(Long id);
    
    BookResponse uploadCover(Long id, MultipartFile cover);
    BookResponse uploadPdf(Long id, MultipartFile pdf);
    BookResponse uploadPreviewPdf(Long id, MultipartFile previewPdf);
}
