package com.meddelivery.meddelivery.repository;

import com.meddelivery.meddelivery.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerEmailOrderByCreatedAtDesc(String email);
    List<Order> findAllByOrderByCreatedAtDesc();
    List<Order> findByStoreId(Long storeId);
    List<Order> findByOrderStatus(Order.OrderStatus status);
}
