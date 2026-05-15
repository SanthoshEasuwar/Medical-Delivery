package com.meddelivery.meddelivery.controller;

import com.meddelivery.meddelivery.dto.MedicineDTO;
import com.meddelivery.meddelivery.model.MedicalStore;
import com.meddelivery.meddelivery.model.User;
import com.meddelivery.meddelivery.repository.MedicalStoreRepository;
import com.meddelivery.meddelivery.repository.UserRepository;
import com.meddelivery.meddelivery.service.MedicineService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicines")
@CrossOrigin(origins = "*")
public class MedicineController {

    private final MedicineService medicineService;
    private final MedicalStoreRepository storeRepository;
    private final UserRepository userRepository;

    public MedicineController(MedicineService medicineService,
                              MedicalStoreRepository storeRepository,
                              UserRepository userRepository) {
        this.medicineService = medicineService;
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<MedicineDTO>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long storeId) {
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(medicineService.searchMedicines(search));
        }
        if (storeId != null) {
            return ResponseEntity.ok(medicineService.getMedicinesByStore(storeId));
        }
        return ResponseEntity.ok(medicineService.getAllMedicines());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicineDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(medicineService.getMedicineById(id));
    }

    @PostMapping
    public ResponseEntity<MedicineDTO> create(@RequestBody MedicineDTO dto) {
        return ResponseEntity.ok(medicineService.createMedicine(dto));
    }

    @PostMapping("/my")
    public ResponseEntity<MedicineDTO> createForOwner(
            @RequestParam Long ownerId,
            @RequestBody MedicineDTO dto) {

        MedicalStore myStore = getOrCreateStoreForOwner(ownerId);
        dto.setStoreId(myStore.getId());
        return ResponseEntity.ok(medicineService.createMedicine(dto));
    }

    private MedicalStore getOrCreateStoreForOwner(Long ownerId) {
        return storeRepository.findByOwnerId(ownerId)
                .orElseGet(() -> {
                    User owner = userRepository.findById(ownerId)
                            .orElseThrow(() -> new RuntimeException("Store owner not found: " + ownerId));

                    if (owner.getRole() != User.Role.STORE) {
                        throw new RuntimeException("User is not a store owner: " + ownerId);
                    }

                    MedicalStore store = new MedicalStore();
                    store.setStoreName(owner.getName() != null && !owner.getName().isBlank()
                            ? owner.getName()
                            : owner.getEmail());
                    store.setLocation("Not specified");
                    store.setAddress("Not specified");
                    store.setOwnerId(owner.getId());
                    return storeRepository.save(store);
                });
    }

    @PutMapping("/{id}")
    public ResponseEntity<MedicineDTO> update(@PathVariable Long id, @RequestBody MedicineDTO dto) {
        return ResponseEntity.ok(medicineService.updateMedicine(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        medicineService.deleteMedicine(id);
        return ResponseEntity.noContent().build();
    }
}
