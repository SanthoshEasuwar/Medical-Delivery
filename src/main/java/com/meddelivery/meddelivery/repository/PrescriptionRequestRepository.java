package com.meddelivery.meddelivery.repository;

import com.meddelivery.meddelivery.model.PrescriptionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRequestRepository extends JpaRepository<PrescriptionRequest, Long> {
    List<PrescriptionRequest> findByStoreIdOrderByCreatedAtDesc(Long storeId);
    List<PrescriptionRequest> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<PrescriptionRequest> findByStatus(PrescriptionRequest.RequestStatus status);
    long countByStatus(PrescriptionRequest.RequestStatus status);
}
