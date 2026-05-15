package com.meddelivery.meddelivery.dto;

public class PrescriptionRequestDTO {
    private Long id;
    private Long patientId;
    private Long storeId;
    private String storeName;
    private String patientName;
    private String patientEmail;
    private String patientPhone;
    private String deliveryAddress;
    private String patientNote;
    private String prescriptionUrl;
    private String medicineSummary;
    private Double billAmount;
    private String storeMessage;
    private String status;
    private String orderStatus;
    private String createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }

    public String getStoreName() { return storeName; }
    public void setStoreName(String storeName) { this.storeName = storeName; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientEmail() { return patientEmail; }
    public void setPatientEmail(String patientEmail) { this.patientEmail = patientEmail; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getPatientNote() { return patientNote; }
    public void setPatientNote(String patientNote) { this.patientNote = patientNote; }

    public String getPrescriptionUrl() { return prescriptionUrl; }
    public void setPrescriptionUrl(String prescriptionUrl) { this.prescriptionUrl = prescriptionUrl; }

    public String getMedicineSummary() { return medicineSummary; }
    public void setMedicineSummary(String medicineSummary) { this.medicineSummary = medicineSummary; }

    public Double getBillAmount() { return billAmount; }
    public void setBillAmount(Double billAmount) { this.billAmount = billAmount; }

    public String getStoreMessage() { return storeMessage; }
    public void setStoreMessage(String storeMessage) { this.storeMessage = storeMessage; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
