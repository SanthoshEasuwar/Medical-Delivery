package com.meddelivery.meddelivery.controller;

import com.meddelivery.meddelivery.dto.PrescriptionRequestDTO;
import com.meddelivery.meddelivery.service.PrescriptionRequestService;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = "*")
public class PrescriptionRequestController {

    private final PrescriptionRequestService service;

    public PrescriptionRequestController(PrescriptionRequestService service) {
        this.service = service;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PrescriptionRequestDTO> create(
            @RequestParam Long patientId,
            @RequestParam Long storeId,
            @RequestParam String patientName,
            @RequestParam String patientEmail,
            @RequestParam String patientPhone,
            @RequestParam String deliveryAddress,
            @RequestParam(required = false) String patientNote,
            @RequestPart MultipartFile prescription) {
        return ResponseEntity.ok(service.create(patientId, storeId, patientName, patientEmail,
                patientPhone, deliveryAddress, patientNote, prescription));
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<PrescriptionRequestDTO>> getByStore(@PathVariable Long storeId) {
        return ResponseEntity.ok(service.getByStore(storeId));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<PrescriptionRequestDTO>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(service.getByPatient(patientId));
    }

    @PatchMapping("/{id}/response")
    public ResponseEntity<PrescriptionRequestDTO> respond(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String medicineSummary,
            @RequestParam(required = false) Double billAmount,
            @RequestParam(required = false) String storeMessage) {
        return ResponseEntity.ok(service.respond(id, status, medicineSummary, billAmount, storeMessage));
    }

    @PatchMapping("/{id}/order-status")
    public ResponseEntity<PrescriptionRequestDTO> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(service.updateOrderStatus(id, status));
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> getFile(@PathVariable Long id) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(service.getPrescriptionContentType(id)))
                .body(service.getPrescriptionResource(id));
    }
}
