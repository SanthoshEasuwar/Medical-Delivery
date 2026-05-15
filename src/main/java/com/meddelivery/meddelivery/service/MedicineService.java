package com.meddelivery.meddelivery.service;

import com.meddelivery.meddelivery.dto.MedicineDTO;
import com.meddelivery.meddelivery.model.Medicine;
import com.meddelivery.meddelivery.model.MedicalStore;
import com.meddelivery.meddelivery.repository.MedicineRepository;
import com.meddelivery.meddelivery.repository.MedicalStoreRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class MedicineService {

    private final MedicineRepository medicineRepository;
    private final MedicalStoreRepository storeRepository;

    public MedicineService(MedicineRepository medicineRepository, MedicalStoreRepository storeRepository) {
        this.medicineRepository = medicineRepository;
        this.storeRepository = storeRepository;
    }

    public List<MedicineDTO> getAllMedicines() {
        List<Medicine> medicines = medicineRepository.findAll();
        List<MedicineDTO> result = new ArrayList<>();
        for (Medicine m : medicines) {
            result.add(toDTO(m));
        }
        return result;
    }

    public List<MedicineDTO> searchMedicines(String name) {
        List<Medicine> medicines = medicineRepository.findByNameContainingIgnoreCase(name);
        List<MedicineDTO> result = new ArrayList<>();
        for (Medicine m : medicines) {
            result.add(toDTO(m));
        }
        return result;
    }

    public List<MedicineDTO> getMedicinesByStore(Long storeId) {
        List<Medicine> medicines = medicineRepository.findByStoreId(storeId);
        List<MedicineDTO> result = new ArrayList<>();
        for (Medicine m : medicines) {
            result.add(toDTO(m));
        }
        return result;
    }

    public MedicineDTO getMedicineById(Long id) {
        Medicine m = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found: " + id));
        return toDTO(m);
    }

    public MedicineDTO createMedicine(MedicineDTO dto) {
        Medicine m = new Medicine();
        m.setName(dto.getName());
        m.setPrice(dto.getPrice());
        m.setStoreId(dto.getStoreId());
        m.setStock(dto.getStock());
        m.setCategory(dto.getCategory());
        m.setDescription(dto.getDescription());
        return toDTO(medicineRepository.save(m));
    }

    public MedicineDTO updateMedicine(Long id, MedicineDTO dto) {
        Medicine m = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found: " + id));
        m.setName(dto.getName());
        m.setPrice(dto.getPrice());
        m.setStoreId(dto.getStoreId());
        m.setStock(dto.getStock());
        m.setCategory(dto.getCategory());
        m.setDescription(dto.getDescription());
        return toDTO(medicineRepository.save(m));
    }

    public void deleteMedicine(Long id) {
        medicineRepository.deleteById(id);
    }

    private MedicineDTO toDTO(Medicine m) {
        MedicineDTO dto = new MedicineDTO();
        dto.setId(m.getId());
        dto.setName(m.getName());
        dto.setPrice(m.getPrice());
        dto.setStoreId(m.getStoreId());
        dto.setStock(m.getStock());
        dto.setCategory(m.getCategory());
        dto.setDescription(m.getDescription());
        // Lookup store name
        if (m.getStoreId() != null) {
            Optional<MedicalStore> store = storeRepository.findById(m.getStoreId());
            store.ifPresent(s -> dto.setStoreName(s.getStoreName()));
        }
        return dto;
    }
}
