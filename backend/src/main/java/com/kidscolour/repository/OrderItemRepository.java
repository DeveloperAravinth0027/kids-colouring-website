package com.kidscolour.repository;

import com.kidscolour.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);

    /** Has this user ordered this book? (gates secure PDF downloads) */
    boolean existsByOrder_User_IdAndBook_Id(Long userId, Long bookId);

    /** Has anyone ordered this book? (a sold book is archived, never deleted) */
    boolean existsByBook_Id(Long bookId);
}
