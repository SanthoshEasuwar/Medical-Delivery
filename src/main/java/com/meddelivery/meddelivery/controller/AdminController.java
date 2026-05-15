package com.meddelivery.meddelivery.controller;

import com.meddelivery.meddelivery.model.MedicalStore;
import com.meddelivery.meddelivery.model.Order;
import com.meddelivery.meddelivery.model.PrescriptionRequest;
import com.meddelivery.meddelivery.model.User;
import com.meddelivery.meddelivery.repository.MedicalStoreRepository;
import com.meddelivery.meddelivery.repository.OrderRepository;
import com.meddelivery.meddelivery.repository.PrescriptionRequestRepository;
import com.meddelivery.meddelivery.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin Controller — provides full platform oversight.
 * All routes prefixed /api/admin/
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final UserRepository userRepository;
    private final MedicalStoreRepository storeRepository;
    private final OrderRepository orderRepository;
    private final PrescriptionRequestRepository prescriptionRepository;

    public AdminController(UserRepository userRepository,
                           MedicalStoreRepository storeRepository,
                           OrderRepository orderRepository,
                           PrescriptionRequestRepository prescriptionRepository) {
        this.userRepository = userRepository;
        this.storeRepository = storeRepository;
        this.orderRepository = orderRepository;
        this.prescriptionRepository = prescriptionRepository;
    }

    // ────────────────────────────────────────────
    //  PLATFORM STATS
    // ────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long totalUsers    = userRepository.count();
        long totalPatients = userRepository.countByRole(User.Role.PATIENT);
        long totalStores   = userRepository.countByRole(User.Role.STORE);
        long totalOrders   = orderRepository.count();
        long totalRx       = prescriptionRepository.count();
        long pendingRx     = prescriptionRepository.countByStatus(PrescriptionRequest.RequestStatus.PENDING);

        double totalRevenue = orderRepository.findAll().stream()
                .mapToDouble(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0)
                .sum();
        double rxRevenue = prescriptionRepository.findAll().stream()
                .filter(r -> r.getBillAmount() != null && r.getStatus() == PrescriptionRequest.RequestStatus.CONFIRMED)
                .mapToDouble(r -> r.getBillAmount())
                .sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers",    totalUsers);
        stats.put("totalPatients", totalPatients);
        stats.put("totalStores",   totalStores);
        stats.put("totalOrders",   totalOrders);
        stats.put("totalRx",       totalRx);
        stats.put("pendingRx",     pendingRx);
        stats.put("totalRevenue",  totalRevenue + rxRevenue);
        return ResponseEntity.ok(stats);
    }

    // ────────────────────────────────────────────
    //  USER MANAGEMENT
    // ────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers(
            @RequestParam(required = false) String role) {
        if (role != null && !role.isBlank()) {
            try {
                User.Role r = User.Role.valueOf(role.toUpperCase());
                return ResponseEntity.ok(userRepository.findByRole(r));
            } catch (Exception e) {
                return ResponseEntity.badRequest().build();
            }
        }
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/users/{id}/block")
    public ResponseEntity<User> toggleBlock(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            if (user.getRole() == User.Role.ADMIN) {
                return ResponseEntity.badRequest().<User>build();
            }
            user.setActive(!user.isActive());
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) return ResponseEntity.notFound().build();
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ────────────────────────────────────────────
    //  STORE MANAGEMENT
    // ────────────────────────────────────────────

    @GetMapping("/stores")
    public ResponseEntity<List<MedicalStore>> getAllStores() {
        return ResponseEntity.ok(storeRepository.findAll());
    }

    @DeleteMapping("/stores/{id}")
    public ResponseEntity<Void> deleteStore(@PathVariable Long id) {
        if (!storeRepository.existsById(id)) return ResponseEntity.notFound().build();
        storeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ────────────────────────────────────────────
    //  ORDER MANAGEMENT
    // ────────────────────────────────────────────

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders(
            @RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            try {
                Order.OrderStatus s = Order.OrderStatus.valueOf(status.toUpperCase());
                return ResponseEntity.ok(orderRepository.findByOrderStatus(s));
            } catch (Exception e) {
                return ResponseEntity.badRequest().build();
            }
        }
        return ResponseEntity.ok(orderRepository.findAll());
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id, @RequestParam String status) {
        return orderRepository.findById(id).map(order -> {
            try {
                order.setOrderStatus(Order.OrderStatus.valueOf(status.toUpperCase()));
                return ResponseEntity.ok(orderRepository.save(order));
            } catch (Exception e) {
                return ResponseEntity.badRequest().<Order>build();
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // ────────────────────────────────────────────
    //  PRESCRIPTION MANAGEMENT
    // ────────────────────────────────────────────

    @GetMapping("/prescriptions")
    public ResponseEntity<List<PrescriptionRequest>> getAllPrescriptions(
            @RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            try {
                PrescriptionRequest.RequestStatus s =
                        PrescriptionRequest.RequestStatus.valueOf(status.toUpperCase());
                return ResponseEntity.ok(prescriptionRepository.findByStatus(s));
            } catch (Exception e) {
                return ResponseEntity.badRequest().build();
            }
        }
        return ResponseEntity.ok(prescriptionRepository.findAll());
    }
}
