package com.meddelivery.meddelivery.repository;

import com.meddelivery.meddelivery.model.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findByNameContainingIgnoreCase(String name);
    List<Medicine> findByStoreId(Long storeId);
    List<Medicine> findByStockGreaterThan(int stock);
}
