package com.kidscolour.service.impl;

import com.kidscolour.dto.request.CategoryRequest;
import com.kidscolour.dto.response.CategoryResponse;
import com.kidscolour.exception.ResourceNotFoundException;
import com.kidscolour.model.Category;
import com.kidscolour.repository.BookRepository;
import com.kidscolour.repository.CategoryRepository;
import com.kidscolour.service.CategoryService;
import com.kidscolour.service.CloudinaryService;
import com.kidscolour.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final BookRepository bookRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    @Cacheable(value = "categories", key = "'all'")
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "categories", key = "'slug-' + #slug")
    public CategoryResponse getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with slug: " + slug));
        return mapToResponse(category);
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse createCategory(CategoryRequest request) {
        String slug = SlugUtil.toSlug(request.getName());
        
        if (categoryRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }
        
        Category category = Category.builder()
                .name(request.getName())
                .bookType(request.getBookType() != null
                        ? request.getBookType()
                        : com.kidscolour.model.enums.CategoryScope.BOTH)
                .slug(slug)
                .description(request.getDescription())
                .colorHex(request.getColorHex())
                .emoji(request.getEmoji())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
                
        if (request.getIconUrl() != null) category.setIconUrl(request.getIconUrl());
        if (request.getCoverImageUrl() != null) category.setCoverImageUrl(request.getCoverImageUrl());
        
        Category savedCategory = categoryRepository.save(category);
        return mapToResponse(savedCategory);
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
                
        if (!category.getName().equals(request.getName())) {
            String slug = SlugUtil.toSlug(request.getName());
            if (!category.getSlug().equals(slug) && categoryRepository.existsBySlug(slug)) {
                slug = slug + "-" + System.currentTimeMillis();
            }
            category.setSlug(slug);
        }
        
        category.setName(request.getName());
        if (request.getBookType() != null) category.setBookType(request.getBookType());
        category.setDescription(request.getDescription());
        category.setColorHex(request.getColorHex());
        // Only overwrite the emoji when one is supplied, so a partial update
        // (e.g. narrowing a category's scope) doesn't wipe it.
        if (request.getEmoji() != null && !request.getEmoji().isBlank()) {
            category.setEmoji(request.getEmoji());
        }
        
        if (request.getSortOrder() != null) category.setSortOrder(request.getSortOrder());
        if (request.getIsActive() != null) category.setIsActive(request.getIsActive());
        if (request.getIconUrl() != null) category.setIconUrl(request.getIconUrl());
        if (request.getCoverImageUrl() != null) category.setCoverImageUrl(request.getCoverImageUrl());
        
        Category updatedCategory = categoryRepository.save(category);
        return mapToResponse(updatedCategory);
    }

    /**
     * Remove a category.
     *
     * A category still referenced by books can't be erased (the DB enforces
     * ON DELETE RESTRICT), and that includes ARCHIVED books an admin can no
     * longer see. Those categories are archived instead — isActive=false hides
     * them from the store and the admin list, exactly like deleting.
     *
     * @return a message describing what actually happened.
     */
    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public String deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        long total = bookRepository.countByCategoryId(id);
        if (total > 0) {
            long active = bookRepository.countByCategoryIdAndIsActiveTrue(id);
            long archived = total - active;
            category.setIsActive(false);
            categoryRepository.save(category);

            String detail = active > 0
                    ? active + " book" + (active == 1 ? "" : "s")
                    : archived + " archived book" + (archived == 1 ? "" : "s");
            return "\"" + category.getName() + "\" has been archived and hidden from the store. "
                    + "It can't be deleted outright because it still holds " + detail + ".";
        }

        categoryRepository.delete(category);
        return "\"" + category.getName() + "\" was deleted.";
    }
    
    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse uploadCategoryImages(Long id, MultipartFile icon, MultipartFile cover) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
                
        if (icon != null && !icon.isEmpty()) {
            String iconUrl = cloudinaryService.uploadCoverImage(icon);
            category.setIconUrl(iconUrl);
        }
        
        if (cover != null && !cover.isEmpty()) {
            String coverUrl = cloudinaryService.uploadCoverImage(cover);
            category.setCoverImageUrl(coverUrl);
        }
        
        Category updatedCategory = categoryRepository.save(category);
        return mapToResponse(updatedCategory);
    }

    private CategoryResponse mapToResponse(Category category) {
        CategoryResponse response = new CategoryResponse();
        response.setId(category.getId());
        response.setName(category.getName());
        response.setSlug(category.getSlug());
        response.setBookType(category.getBookType() != null ? category.getBookType().name() : "BOTH");
        response.setDescription(category.getDescription());
        response.setIconUrl(category.getIconUrl());
        response.setCoverImageUrl(category.getCoverImageUrl());
        response.setColorHex(category.getColorHex());
        response.setEmoji(category.getEmoji());
        return response;
    }
}
