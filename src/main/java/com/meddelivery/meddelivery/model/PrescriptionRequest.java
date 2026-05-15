package com.meddelivery.meddelivery.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prescription_requests")
public class PrescriptionRequest {

    public enum RequestStatus { PENDING, CONFIRMED, NOT_CONFIRMED }
    public enum DeliveryStatus { PLACED, CONFIRMED, OUT_FOR_DELIVERY, DELIVERED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "store_id")
    private Long storeId;

    @Column(name = "patient_name", length = 255)
    private String patientName;

    @Column(name = "patient_email", length = 255)
    private String patientEmail;

    @Column(name = "patient_phone", length = 255)
    private String patientPhone;

    @Column(name = "delivery_address", length = 500)
    private String deliveryAddress;

    @Column(name = "patient_note", length = 1000)
    private String patientNote;

    @Column(name = "prescription_file_path", length = 500)
    private String prescriptionFilePath;

    @Column(name = "medicine_summary", length = 1000)
    private String medicineSummary;

    @Column(name = "bill_amount")
    private Double billAmount;

    @Column(name = "store_message", length = 1000)
    private String storeMessage;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    private RequestStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", length = 30)
    private DeliveryStatus orderStatus;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = RequestStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }

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

    public String getPrescriptionFilePath() { return prescriptionFilePath; }
    public void setPrescriptionFilePath(String prescriptionFilePath) { this.prescriptionFilePath = prescriptionFilePath; }

    public String getMedicineSummary() { return medicineSummary; }
    public void setMedicineSummary(String medicineSummary) { this.medicineSummary = medicineSummary; }

    public Double getBillAmount() { return billAmount; }
    public void setBillAmount(Double billAmount) { this.billAmount = billAmount; }

    public String getStoreMessage() { return storeMessage; }
    public void setStoreMessage(String storeMessage) { this.storeMessage = storeMessage; }

    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public DeliveryStatus getOrderStatus() { return orderStatus; }
    public void setOrderStatus(DeliveryStatus orderStatus) { this.orderStatus = orderStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
