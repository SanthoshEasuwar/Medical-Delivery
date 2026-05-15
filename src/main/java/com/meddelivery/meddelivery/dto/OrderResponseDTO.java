package com.meddelivery.meddelivery.dto;

import java.util.List;

public class OrderResponseDTO {
    private Long id;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String deliveryAddress;
    private String orderStatus;
    private Double totalAmount;
    private String createdAt;
    private String prescriptionUrl;
    private List<OrderItemResponseDTO> items;

    public OrderResponseDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getPrescriptionUrl() { return prescriptionUrl; }
    public void setPrescriptionUrl(String prescriptionUrl) { this.prescriptionUrl = prescriptionUrl; }

    public List<OrderItemResponseDTO> getItems() { return items; }
    public void setItems(List<OrderItemResponseDTO> items) { this.items = items; }

    public static class OrderItemResponseDTO {
        private Long medicineId;
        private String medicineName;
        private Integer quantity;
        private Double unitPrice;
        private Double subtotal;

        public OrderItemResponseDTO() {}

        public Long getMedicineId() { return medicineId; }
        public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }

        public String getMedicineName() { return medicineName; }
        public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }

        public Double getUnitPrice() { return unitPrice; }
        public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }

        public Double getSubtotal() { return subtotal; }
        public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }
    }
}
