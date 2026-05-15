package com.meddelivery.meddelivery.service;

import com.meddelivery.meddelivery.dto.OrderRequestDTO;
import com.meddelivery.meddelivery.dto.OrderResponseDTO;
import com.meddelivery.meddelivery.model.Medicine;
import com.meddelivery.meddelivery.model.Order;
import com.meddelivery.meddelivery.model.OrderItem;
import com.meddelivery.meddelivery.repository.MedicineRepository;
import com.meddelivery.meddelivery.repository.OrderRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final MedicineRepository medicineRepository;
    private final Path prescriptionDir = Paths.get("uploads", "prescriptions").toAbsolutePath().normalize();
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "pdf");

    public OrderService(OrderRepository orderRepository, MedicineRepository medicineRepository) {
        this.orderRepository = orderRepository;
        this.medicineRepository = medicineRepository;
    }

    public List<OrderResponseDTO> getAllOrders() {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        List<OrderResponseDTO> result = new ArrayList<>();
        for (Order o : orders) result.add(toDTO(o));
        return result;
    }

    public List<OrderResponseDTO> getOrdersByStore(Long storeId) {
        return orderRepository.findByStoreId(storeId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public OrderResponseDTO getOrderById(Long id) {
        Order o = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));
        return toDTO(o);
    }

    public List<OrderResponseDTO> getOrdersByEmail(String email) {
        List<Order> orders = orderRepository.findByCustomerEmailOrderByCreatedAtDesc(email);
        List<OrderResponseDTO> result = new ArrayList<>();
        for (Order o : orders) result.add(toDTO(o));
        return result;
    }

    @Transactional
    public OrderResponseDTO placeOrder(OrderRequestDTO req) {
        return placeOrder(req, null);
    }

    @Transactional
    public OrderResponseDTO placeOrder(OrderRequestDTO req, MultipartFile prescription) {
        // Save order first to get its generated ID — Error 8 fix
        Order order = new Order();
        order.setCustomerName(req.getCustomerName());
        order.setCustomerEmail(req.getCustomerEmail());
        order.setCustomerPhone(req.getCustomerPhone());
        order.setDeliveryAddress(req.getDeliveryAddress());
        order.setStoreId(req.getStoreId());
        Order savedOrder = orderRepository.save(order);

        if (prescription != null && !prescription.isEmpty()) {
            savedOrder.setPrescriptionFilePath(savePrescription(savedOrder.getId(), prescription));
        }

        List<OrderItem> items = new ArrayList<>();
        double total = 0;

        for (OrderRequestDTO.OrderItemRequestDTO itemReq : req.getItems()) {
            Medicine medicine = medicineRepository.findById(itemReq.getMedicineId())
                    .orElseThrow(() -> new RuntimeException("Medicine not found: " + itemReq.getMedicineId()));

            if (medicine.getStock() < itemReq.getQuantity()) {
                throw new RuntimeException("Insufficient stock for: " + medicine.getName());
            }

            // Deduct stock
            medicine.setStock(medicine.getStock() - itemReq.getQuantity());
            medicineRepository.save(medicine);

            double subtotal = medicine.getPrice() * itemReq.getQuantity();
            total += subtotal;

            OrderItem item = new OrderItem();
            item.setOrder(savedOrder);
            item.setMedicineId(medicine.getId());
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(medicine.getPrice()); // Error 4 fix — only unitPrice, no setPrice
            //item.setPrice(medicine.getPrice());
            item.setSubtotal(subtotal);
            items.add(item);
        }

        savedOrder.setOrderItems(items);
        savedOrder.setTotalAmount(total);
        return toDTO(orderRepository.save(savedOrder));
    }

    public Resource getPrescriptionResource(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        if (order.getPrescriptionFilePath() == null || order.getPrescriptionFilePath().isBlank()) {
            throw new RuntimeException("Prescription not found for order: " + orderId);
        }

        try {
            Path filePath = Paths.get(order.getPrescriptionFilePath()).toAbsolutePath().normalize();
            if (!filePath.startsWith(prescriptionDir) || !Files.exists(filePath)) {
                throw new RuntimeException("Prescription file is unavailable.");
            }
            return new UrlResource(filePath.toUri());
        } catch (MalformedURLException e) {
            throw new RuntimeException("Prescription file is unavailable.");
        }
    }

    public String getPrescriptionContentType(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        try {
            String type = Files.probeContentType(Paths.get(order.getPrescriptionFilePath()));
            return type != null ? type : "application/octet-stream";
        } catch (IOException | RuntimeException e) {
            return "application/octet-stream";
        }
    }

    private String savePrescription(Long orderId, MultipartFile prescription) {
        String originalName = prescription.getOriginalFilename() != null ? prescription.getOriginalFilename() : "";
        String extension = getExtension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new RuntimeException("Prescription must be a JPG, PNG, or PDF file.");
        }

        try {
            Files.createDirectories(prescriptionDir);
            String filename = "order-" + orderId + "-" + UUID.randomUUID() + "." + extension;
            Path destination = prescriptionDir.resolve(filename).normalize();
            if (!destination.startsWith(prescriptionDir)) {
                throw new RuntimeException("Invalid prescription filename.");
            }
            prescription.transferTo(destination);
            return destination.toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to save prescription.");
        }
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) return "";
        return filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    @Transactional
    public OrderResponseDTO updateStatus(Long id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found: " + id));

        // Error 9 fix — safe enum parsing, return 400 on invalid status
        Order.OrderStatus newStatus;
        try {
            newStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status. Allowed values: PLACED, CONFIRMED, OUT_FOR_DELIVERY, DELIVERED");
        }

        order.setOrderStatus(newStatus);
        return toDTO(orderRepository.save(order));
    }

    private OrderResponseDTO toDTO(Order o) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setId(o.getId());
        dto.setCustomerName(o.getCustomerName());
        dto.setCustomerEmail(o.getCustomerEmail());
        dto.setCustomerPhone(o.getCustomerPhone());
        dto.setDeliveryAddress(o.getDeliveryAddress());
        dto.setOrderStatus(o.getOrderStatus() != null ? o.getOrderStatus().name() : "PLACED");
        dto.setTotalAmount(o.getTotalAmount());
        dto.setCreatedAt(o.getCreatedAt() != null ? o.getCreatedAt().toString() : "");
        if (o.getPrescriptionFilePath() != null && !o.getPrescriptionFilePath().isBlank()) {
            dto.setPrescriptionUrl("/api/orders/" + o.getId() + "/prescription");
        }

        List<OrderResponseDTO.OrderItemResponseDTO> itemDTOs = new ArrayList<>();
        if (o.getOrderItems() != null) {
            for (OrderItem i : o.getOrderItems()) {
                OrderResponseDTO.OrderItemResponseDTO itemDTO = new OrderResponseDTO.OrderItemResponseDTO();
                itemDTO.setMedicineId(i.getMedicineId());
                itemDTO.setQuantity(i.getQuantity());
                itemDTO.setUnitPrice(i.getUnitPrice());
                itemDTO.setSubtotal(i.getSubtotal());
                // Get medicine name
                medicineRepository.findById(i.getMedicineId())
                        .ifPresent(m -> itemDTO.setMedicineName(m.getName()));
                itemDTOs.add(itemDTO);
            }
        }
        dto.setItems(itemDTOs);
        return dto;
    }
}
