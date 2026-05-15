package com.meddelivery.meddelivery.service;

import com.meddelivery.meddelivery.dto.PrescriptionRequestDTO;
//import com.meddelivery.meddelivery.model.MedicalStore;
import com.meddelivery.meddelivery.model.PrescriptionRequest;
import com.meddelivery.meddelivery.repository.MedicalStoreRepository;
import com.meddelivery.meddelivery.repository.PrescriptionRequestRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PrescriptionRequestService {

    private final PrescriptionRequestRepository requestRepository;
    private final MedicalStoreRepository storeRepository;
    private final Path prescriptionDir = Paths.get("uploads", "prescriptions").toAbsolutePath().normalize();
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "pdf");

    public PrescriptionRequestService(PrescriptionRequestRepository requestRepository,
            MedicalStoreRepository storeRepository) {
        this.requestRepository = requestRepository;
        this.storeRepository = storeRepository;
    }

    public PrescriptionRequestDTO create(Long patientId,
            Long storeId,
            String patientName,
            String patientEmail,
            String patientPhone,
            String deliveryAddress,
            String patientNote,
            MultipartFile prescription) {
        if (prescription == null || prescription.isEmpty()) {
            throw new RuntimeException("Prescription file is required.");
        }

        storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Store not found: " + storeId));

        PrescriptionRequest request = new PrescriptionRequest();
        request.setPatientId(patientId);
        request.setStoreId(storeId);
        request.setPatientName(patientName);
        request.setPatientEmail(patientEmail);
        request.setPatientPhone(patientPhone);
        request.setDeliveryAddress(deliveryAddress);
        request.setPatientNote(patientNote);
        PrescriptionRequest saved = requestRepository.save(request);
        saved.setPrescriptionFilePath(savePrescription(saved.getId(), prescription));
        return toDTO(requestRepository.save(saved));
    }

    public List<PrescriptionRequestDTO> getByStore(Long storeId) {
        return requestRepository.findByStoreIdOrderByCreatedAtDesc(storeId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<PrescriptionRequestDTO> getByPatient(Long patientId) {
        return requestRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public PrescriptionRequestDTO respond(Long id,
            String status,
            String medicineSummary,
            Double billAmount,
            String storeMessage) {
        PrescriptionRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription request not found: " + id));

        PrescriptionRequest.RequestStatus newStatus;
        try {
            newStatus = PrescriptionRequest.RequestStatus.valueOf(status.toUpperCase(Locale.ROOT));
        } catch (RuntimeException e) {
            throw new RuntimeException("Invalid status. Use CONFIRMED or NOT_CONFIRMED.");
        }

        request.setStatus(newStatus);
        request.setOrderStatus(newStatus == PrescriptionRequest.RequestStatus.CONFIRMED
                ? PrescriptionRequest.DeliveryStatus.CONFIRMED
                : null);
        request.setMedicineSummary(medicineSummary);
        request.setBillAmount(billAmount);
        request.setStoreMessage(storeMessage);
        return toDTO(requestRepository.save(request));
    }

    public PrescriptionRequestDTO updateOrderStatus(Long id, String orderStatus) {
        PrescriptionRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription request not found: " + id));

        if (request.getStatus() != PrescriptionRequest.RequestStatus.CONFIRMED) {
            throw new RuntimeException("Only confirmed prescription requests can be updated for delivery.");
        }

        PrescriptionRequest.DeliveryStatus newStatus;
        try {
            newStatus = PrescriptionRequest.DeliveryStatus.valueOf(orderStatus.toUpperCase(Locale.ROOT));
        } catch (RuntimeException e) {
            throw new RuntimeException("Invalid order status. Allowed values: CONFIRMED, OUT_FOR_DELIVERY, DELIVERED.");
        }

        request.setOrderStatus(newStatus);
        return toDTO(requestRepository.save(request));
    }

    public Resource getPrescriptionResource(Long id) {
        PrescriptionRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription request not found: " + id));

        try {
            Path filePath = Paths.get(request.getPrescriptionFilePath()).toAbsolutePath().normalize();
            if (!filePath.startsWith(prescriptionDir) || !Files.exists(filePath)) {
                throw new RuntimeException("Prescription file is unavailable.");
            }
            return new UrlResource(filePath.toUri());
        } catch (MalformedURLException e) {
            throw new RuntimeException("Prescription file is unavailable.");
        }
    }

    public String getPrescriptionContentType(Long id) {
        PrescriptionRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription request not found: " + id));
        try {
            String type = Files.probeContentType(Paths.get(request.getPrescriptionFilePath()));
            return type != null ? type : "application/octet-stream";
        } catch (IOException | RuntimeException e) {
            return "application/octet-stream";
        }
    }

    private PrescriptionRequestDTO toDTO(PrescriptionRequest request) {
        PrescriptionRequestDTO dto = new PrescriptionRequestDTO();
        dto.setId(request.getId());
        dto.setPatientId(request.getPatientId());
        dto.setStoreId(request.getStoreId());
        dto.setPatientName(request.getPatientName());
        dto.setPatientEmail(request.getPatientEmail());
        dto.setPatientPhone(request.getPatientPhone());
        dto.setDeliveryAddress(request.getDeliveryAddress());
        dto.setPatientNote(request.getPatientNote());
        dto.setMedicineSummary(request.getMedicineSummary());
        dto.setBillAmount(request.getBillAmount());
        dto.setStoreMessage(request.getStoreMessage());
        dto.setStatus(request.getStatus() != null ? request.getStatus().name() : "PENDING");
        dto.setOrderStatus(request.getOrderStatus() != null ? request.getOrderStatus().name() : "");
        dto.setCreatedAt(request.getCreatedAt() != null ? request.getCreatedAt().toString() : "");
        dto.setPrescriptionUrl("/api/prescriptions/" + request.getId() + "/file");
        storeRepository.findById(request.getStoreId()).ifPresent(store -> dto.setStoreName(store.getStoreName()));
        return dto;
    }

    private String savePrescription(Long requestId, MultipartFile prescription) {
        String originalName = prescription.getOriginalFilename() != null ? prescription.getOriginalFilename() : "";
        String extension = getExtension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new RuntimeException("Prescription must be a JPG, PNG, or PDF file.");
        }

        try {
            Files.createDirectories(prescriptionDir);
            String filename = "request-" + requestId + "-" + UUID.randomUUID() + "." + extension;
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
        if (dot < 0 || dot == filename.length() - 1)
            return "";
        return filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
