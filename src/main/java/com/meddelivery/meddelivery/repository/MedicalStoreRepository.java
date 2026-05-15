package com.meddelivery.meddelivery.repository;

import com.meddelivery.meddelivery.model.MedicalStore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MedicalStoreRepository extends JpaRepository<MedicalStore, Long> {
    Optional<MedicalStore> findByOwnerId(Long ownerId);
}
