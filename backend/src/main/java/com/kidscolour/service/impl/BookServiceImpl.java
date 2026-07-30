package com.kidscolour.service.impl;

import com.kidscolour.dto.request.BookRequest;
import com.kidscolour.dto.response.BookListResponse;
import com.kidscolour.dto.response.BookResponse;
import com.kidscolour.dto.response.CategoryResponse;
import com.kidscolour.dto.response.PagedResponse;
import com.kidscolour.exception.ResourceNotFoundException;
import com.kidscolour.model.Book;
import com.kidscolour.model.BookTag;
import com.kidscolour.model.Category;
import com.kidscolour.repository.BookRepository;
import com.kidscolour.repository.CategoryRepository;
import com.kidscolour.repository.OrderItemRepository;
import com.kidscolour.service.BookService;
import com.kidscolour.service.CloudinaryService;
import com.kidscolour.service.S3Service;
import com.kidscolour.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;
    private final OrderItemRepository orderItemRepository;
    private final S3Service s3Service;
    private final CloudinaryService cloudinaryService;

    @Override
    @Cacheable(value = "books", key = "'all-' + #page + '-' + #size")
    public PagedResponse<BookListResponse> getAllBooks(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Book> books = bookRepository.findByIsActiveTrue(pageable);
        return PagedResponse.of(books.map(this::mapToListResponse));
    }

    @Override
    @Cacheable(value = "books", key = "'featured-' + #page + '-' + #size")
    public PagedResponse<BookListResponse> getFeaturedBooks(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Book> books = bookRepository.findByIsFeaturedTrueAndIsActiveTrue(pageable);
        return PagedResponse.of(books.map(this::mapToListResponse));
    }

    @Override
    public PagedResponse<BookListResponse> getFreeBooks(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Book> books = bookRepository.findByIsFreeTrueAndIsActiveTrue(pageable);
        return PagedResponse.of(books.map(this::mapToListResponse));
    }

    @Override
    @Cacheable(value = "books", key = "'cat-' + #categoryId + '-' + #page + '-' + #size")
    public PagedResponse<BookListResponse> getBooksByCategory(Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Book> books = bookRepository.findByCategoryIdAndIsActiveTrue(categoryId, pageable);
        return PagedResponse.of(books.map(this::mapToListResponse));
    }

    @Override
    public PagedResponse<BookListResponse> searchBooks(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String searchQuery = (query == null || query.trim().isEmpty()) ? "*" : query + "*";
        Page<Book> books = bookRepository.searchBooks(searchQuery, pageable);
        return PagedResponse.of(books.map(this::mapToListResponse));
    }

    @Override
    @Cacheable(value = "bookDetail", key = "#slug")
    public BookResponse getBookBySlug(String slug) {
        Book book = bookRepository.findBySlugWithCategory(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with slug: " + slug));
        return mapToResponse(book);
    }

    @Override
    public BookResponse getBookById(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
        return mapToResponse(book);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "books", allEntries = true),
        @CacheEvict(value = "bookDetail", allEntries = true)
    })
    public BookResponse createBook(BookRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        String slug = SlugUtil.toSlug(request.getName());
        if (bookRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        BigDecimal finalPrice = calculateFinalPrice(request.getPrice(), request.getDiscountPercent());

        Book book = Book.builder()
                .category(category)
                .bookType(request.getBookType() != null
                        ? request.getBookType()
                        : com.kidscolour.model.enums.BookType.COLOURING)
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .shortDescription(request.getShortDescription())
                .ageGroup(request.getAgeGroup())
                .numPages(request.getNumPages())
                .language(request.getLanguage() != null ? request.getLanguage() : "English")
                .price(request.getPrice())
                .discountPercent(request.getDiscountPercent())
                .finalPrice(finalPrice)
                .amazonKdpLink(request.getAmazonKdpLink())
                .coverImageUrl(request.getCoverImageUrl())
                .isFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .isFree(request.getIsFree() != null ? request.getIsFree() : false)
                .totalDownloads(0)
                .totalSales(0)
                .averageRating(BigDecimal.ZERO)
                .reviewCount(0)
                .seoTitle(request.getSeoTitle())
                .seoDescription(request.getSeoDescription())
                .seoKeywords(request.getSeoKeywords())
                .build();

        Book savedBook = bookRepository.save(book);
        
        // Save tags if provided
        // Normally would have a BookTagRepository and save them
        
        return mapToResponse(savedBook);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "books", allEntries = true),
        @CacheEvict(value = "bookDetail", allEntries = true)
    })
    public BookResponse updateBook(Long id, BookRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));

        if (!book.getCategory().getId().equals(request.getCategoryId())) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
            book.setCategory(category);
        }

        if (!book.getName().equals(request.getName())) {
            String slug = SlugUtil.toSlug(request.getName());
            if (!book.getSlug().equals(slug) && bookRepository.existsBySlug(slug)) {
                slug = slug + "-" + System.currentTimeMillis();
            }
            book.setSlug(slug);
        }

        BigDecimal finalPrice = calculateFinalPrice(request.getPrice(), request.getDiscountPercent());

        book.setName(request.getName());
        book.setDescription(request.getDescription());
        book.setShortDescription(request.getShortDescription());
        book.setAgeGroup(request.getAgeGroup());
        book.setNumPages(request.getNumPages());
        
        if (request.getLanguage() != null) book.setLanguage(request.getLanguage());
        
        book.setPrice(request.getPrice());
        book.setDiscountPercent(request.getDiscountPercent());
        book.setFinalPrice(finalPrice);
        book.setAmazonKdpLink(request.getAmazonKdpLink());
        
        if (request.getBookType() != null) book.setBookType(request.getBookType());
        // Only overwrite the cover from a URL; uploaded-file covers are set by
        // the cover endpoint and must not be wiped by a normal save.
        if (request.getCoverImageUrl() != null && !request.getCoverImageUrl().isBlank()) {
            book.setCoverImageUrl(request.getCoverImageUrl());
        }
        if (request.getIsFeatured() != null) book.setIsFeatured(request.getIsFeatured());
        if (request.getIsActive() != null) book.setIsActive(request.getIsActive());
        if (request.getIsFree() != null) book.setIsFree(request.getIsFree());
        
        book.setSeoTitle(request.getSeoTitle());
        book.setSeoDescription(request.getSeoDescription());
        book.setSeoKeywords(request.getSeoKeywords());

        Book updatedBook = bookRepository.save(book);
        return mapToResponse(updatedBook);
    }

    /**
     * Remove a book from the store.
     *
     * A book that customers have already ordered can never be erased — doing so
     * would break their order history and their right to re-download it (the DB
     * enforces this with ON DELETE RESTRICT). Those are archived instead:
     * isActive=false hides them everywhere, since every listing query filters on
     * isActive. Books nobody has bought are deleted outright.
     *
     * @return a message describing what actually happened.
     */
    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "books", allEntries = true),
        @CacheEvict(value = "bookDetail", allEntries = true)
    })
    public String deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));

        if (orderItemRepository.existsByBook_Id(id)) {
            book.setIsActive(false);
            book.setIsFeatured(false);
            bookRepository.save(book);
            log.info("Book {} archived (has orders) instead of deleted", id);
            return "\"" + book.getName() + "\" has been archived and removed from the store. "
                    + "It can't be deleted outright because customers have already bought it.";
        }

        bookRepository.delete(book);
        log.info("Book {} deleted permanently (no orders)", id);
        return "\"" + book.getName() + "\" was deleted.";
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "books", allEntries = true),
        @CacheEvict(value = "bookDetail", allEntries = true)
    })
    public BookResponse uploadCover(Long id, MultipartFile cover) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
                
        String coverUrl = cloudinaryService.uploadCoverImage(cover);
        book.setCoverImageUrl(coverUrl);
        Book updatedBook = bookRepository.save(book);
        
        return mapToResponse(updatedBook);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "books", allEntries = true),
        @CacheEvict(value = "bookDetail", allEntries = true)
    })
    public BookResponse uploadPdf(Long id, MultipartFile pdf) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
                
        if (book.getPdfS3Key() != null) {
            s3Service.deleteFile(book.getPdfS3Key());
        }
                
        String s3Key = s3Service.uploadFile(pdf);
        book.setPdfS3Key(s3Key);
        
        // Calculate size in MB
        double sizeInMb = (double) pdf.getSize() / (1024 * 1024);
        book.setPdfSizeMb(BigDecimal.valueOf(sizeInMb));
        
        Book updatedBook = bookRepository.save(book);
        return mapToResponse(updatedBook);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "books", allEntries = true),
        @CacheEvict(value = "bookDetail", allEntries = true)
    })
    public BookResponse uploadPreviewPdf(Long id, MultipartFile previewPdf) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
                
        // For preview PDF, we might just upload to S3 but make it public, 
        // or upload to Cloudinary. Let's use S3 and assume the bucket allows public read for previews, 
        // or generate a long-lived presigned URL.
        
        String s3Key = s3Service.uploadFile(previewPdf);
        String previewUrl = s3Service.generatePresignedUrl(s3Key); // Temporary for now
        book.setPreviewPdfUrl(previewUrl);
        
        Book updatedBook = bookRepository.save(book);
        return mapToResponse(updatedBook);
    }

    private BigDecimal calculateFinalPrice(BigDecimal price, Integer discountPercent) {
        if (price == null) return BigDecimal.ZERO;
        if (discountPercent == null || discountPercent == 0) return price;
        
        BigDecimal discount = price.multiply(BigDecimal.valueOf(discountPercent)).divide(BigDecimal.valueOf(100));
        return price.subtract(discount);
    }

    private BookListResponse mapToListResponse(Book book) {
        BookListResponse response = new BookListResponse();
        response.setId(book.getId());
        response.setBookType(book.getBookType() != null ? book.getBookType().name() : "COLOURING");
        response.setCategoryName(book.getCategory().getName());
        response.setCategorySlug(book.getCategory().getSlug());
        response.setName(book.getName());
        response.setSlug(book.getSlug());
        response.setShortDescription(book.getShortDescription());
        response.setAgeGroup(book.getAgeGroup());
        response.setCoverImageUrl(book.getCoverImageUrl());
        response.setPrice(book.getPrice());
        response.setDiscountPercent(book.getDiscountPercent());
        response.setFinalPrice(book.getFinalPrice());
        response.setIsFeatured(book.getIsFeatured());
        response.setIsFree(book.getIsFree());
        response.setHasPdf(book.getPdfS3Key() != null && !book.getPdfS3Key().isBlank());
        response.setAmazonKdpLink(book.getAmazonKdpLink());
        response.setAverageRating(book.getAverageRating());
        response.setReviewCount(book.getReviewCount());
        return response;
    }

    private BookResponse mapToResponse(Book book) {
        BookResponse response = new BookResponse();
        response.setId(book.getId());
        response.setBookType(book.getBookType() != null ? book.getBookType().name() : "COLOURING");
        
        CategoryResponse categoryResponse = new CategoryResponse();
        categoryResponse.setId(book.getCategory().getId());
        categoryResponse.setName(book.getCategory().getName());
        categoryResponse.setSlug(book.getCategory().getSlug());
        response.setCategory(categoryResponse);
        
        response.setName(book.getName());
        response.setSlug(book.getSlug());
        response.setDescription(book.getDescription());
        response.setShortDescription(book.getShortDescription());
        response.setAgeGroup(book.getAgeGroup());
        response.setNumPages(book.getNumPages());
        response.setLanguage(book.getLanguage());
        response.setCoverImageUrl(book.getCoverImageUrl());
        response.setPdfSizeMb(book.getPdfSizeMb());
        response.setPreviewPdfUrl(book.getPreviewPdfUrl());
        response.setPrice(book.getPrice());
        response.setDiscountPercent(book.getDiscountPercent());
        response.setFinalPrice(book.getFinalPrice());
        response.setAmazonKdpLink(book.getAmazonKdpLink());
        response.setIsFeatured(book.getIsFeatured());
        response.setIsActive(book.getIsActive());
        response.setIsFree(book.getIsFree());
        response.setHasPdf(book.getPdfS3Key() != null && !book.getPdfS3Key().isBlank());
        response.setTotalDownloads(book.getTotalDownloads());
        response.setTotalSales(book.getTotalSales());
        response.setAverageRating(book.getAverageRating());
        response.setReviewCount(book.getReviewCount());
        response.setSeoTitle(book.getSeoTitle());
        response.setSeoDescription(book.getSeoDescription());
        response.setSeoKeywords(book.getSeoKeywords());
        
        // Tags and Preview Images would be mapped here
        response.setTags(new ArrayList<>());
        response.setPreviewImages(new ArrayList<>());
        
        return response;
    }
}
