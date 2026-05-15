package com.meddelivery.meddelivery.controller;

import com.meddelivery.meddelivery.model.MedicalStore;
import com.meddelivery.meddelivery.repository.MedicalStoreRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
@CrossOrigin(origins = "*")
public class StoreController {

    private final MedicalStoreRepository storeRepository;

    public StoreController(MedicalStoreRepository storeRepository) {
        this.storeRepository = storeRepository;
    }

    @GetMapping
    public ResponseEntity<List<MedicalStore>> getAll() {
        return ResponseEntity.ok(storeRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicalStore> getById(@PathVariable Long id) {
        return ResponseEntity.ok(storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Store not found: " + id)));
    }

    @PostMapping
    public ResponseEntity<MedicalStore> create(@RequestBody MedicalStore store) {
        return ResponseEntity.ok(storeRepository.save(store));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MedicalStore> update(@PathVariable Long id, @RequestBody MedicalStore req) {
        MedicalStore store = storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Store not found: " + id));
        store.setStoreName(req.getStoreName());
        store.setLocation(req.getLocation());
        store.setAddress(req.getAddress());
        store.setOwnerId(req.getOwnerId());
        return ResponseEntity.ok(storeRepository.save(store));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        storeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
