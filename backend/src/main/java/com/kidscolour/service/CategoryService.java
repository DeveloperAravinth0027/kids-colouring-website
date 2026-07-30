package com.kidscolour.service;

import com.kidscolour.dto.request.CategoryRequest;
import com.kidscolour.dto.response.CategoryResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories();
    CategoryResponse getCategoryBySlug(String slug);
    CategoryResponse createCategory(CategoryRequest request);
    CategoryResponse updateCategory(Long id, CategoryRequest request);
    /** Deletes an unused category, archives one that still holds books. */
    String deleteCategory(Long id);
    CategoryResponse uploadCategoryImages(Long id, MultipartFile icon, MultipartFile cover);
}
