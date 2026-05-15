package com.meddelivery.meddelivery.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meddelivery.meddelivery.dto.OrderRequestDTO;
import com.meddelivery.meddelivery.dto.OrderResponseDTO;
import com.meddelivery.meddelivery.service.OrderService;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    public OrderController(OrderService orderService, ObjectMapper objectMapper) {
        this.orderService = orderService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public ResponseEntity<List<OrderResponseDTO>> getAll() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @GetMapping("/track")
    public ResponseEntity<List<OrderResponseDTO>> trackByEmail(@RequestParam String email) {
        return ResponseEntity.ok(orderService.getOrdersByEmail(email));
    }

    @PostMapping
    public ResponseEntity<OrderResponseDTO> placeOrder(@RequestBody OrderRequestDTO dto) {
        return ResponseEntity.ok(orderService.placeOrder(dto));
    }

    @PostMapping(value = "/with-prescription", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OrderResponseDTO> placeOrderWithPrescription(
            @RequestPart("order") String orderJson,
            @RequestPart(value = "prescription", required = false) MultipartFile prescription) throws IOException {
        OrderRequestDTO dto = objectMapper.readValue(orderJson, OrderRequestDTO.class);
        return ResponseEntity.ok(orderService.placeOrder(dto, prescription));
    }

    @GetMapping("/{id}/prescription")
    public ResponseEntity<Resource> getPrescription(@PathVariable Long id) {
        Resource resource = orderService.getPrescriptionResource(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(orderService.getPrescriptionContentType(id)))
                .body(resource);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponseDTO> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateStatus(id, status));
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<OrderResponseDTO>> getByStore(@PathVariable Long storeId) {
        return ResponseEntity.ok(orderService.getOrdersByStore(storeId));
    }
}
