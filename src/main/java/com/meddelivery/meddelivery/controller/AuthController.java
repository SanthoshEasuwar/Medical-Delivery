package com.meddelivery.meddelivery.controller;

import com.meddelivery.meddelivery.dto.Logindto;
import com.meddelivery.meddelivery.dto.Registerdto;
import com.meddelivery.meddelivery.model.MedicalStore;
import com.meddelivery.meddelivery.model.User;
import com.meddelivery.meddelivery.repository.MedicalStoreRepository;
import com.meddelivery.meddelivery.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    private final UserRepository userRepository;
    private final MedicalStoreRepository storeRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository,
                          MedicalStoreRepository storeRepository,
                          BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.storeRepository = storeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Registerdto dto) {

        if (dto.getName() == null || dto.getName().isBlank() ||
            dto.getEmail() == null || dto.getEmail().isBlank() ||
            dto.getPassword() == null || dto.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body("Name, email, and password are required.");
        }

        if (dto.getPassword().length() < 6) {
            return ResponseEntity.badRequest().body("Password must be at least 6 characters.");
        }

        // Safe role parsing — error 7 fix
        User.Role role;
        try {
            role = User.Role.valueOf(dto.getRole().toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid role. Must be PATIENT or STORE.");
        }

        // ADMIN accounts cannot be self-registered — created by seeder only
        if (role == User.Role.ADMIN) {
            return ResponseEntity.badRequest().body("Admin accounts cannot be self-registered.");
        }

        if (userRepository.existsByEmail(dto.getEmail())) {
            return ResponseEntity.badRequest().body("Email already exists.");
        }

        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword())); // Error 5 fix — BCrypt hash
        user.setRole(role);

        User savedUser = userRepository.save(user);
        if (savedUser.getRole() == User.Role.STORE) {
            MedicalStore store = new MedicalStore();
            store.setStoreName(savedUser.getName());
            store.setLocation("Not specified");
            store.setAddress("Not specified");
            store.setOwnerId(savedUser.getId());
            storeRepository.save(store);
        }

        return ResponseEntity.ok("User registered successfully.");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Logindto dto) {

        if (dto.getEmail() == null || dto.getEmail().isBlank() ||
            dto.getPassword() == null || dto.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body("Email and password are required.");
        }

        // Error 6 fix — return 400 instead of 500 when user not found
        User user = userRepository.findByEmail(dto.getEmail()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("No account found with this email.");
        }

        // Error 5 fix — BCrypt comparison
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Invalid password.");
        }

        // Error 7 fix — safe role parsing
        User.Role role;
        try {
            role = User.Role.valueOf(dto.getRole().toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid role. Must be PATIENT, STORE, or ADMIN.");
        }

        if (!user.getRole().equals(role)) {
            return ResponseEntity.badRequest().body("Role mismatch. Please select the correct role.");
        }

        if (!user.isActive()) {
            return ResponseEntity.status(403).body("Your account has been blocked. Please contact admin.");
        }

        user.setPassword(null);   
        return ResponseEntity.ok(user);
    }
}
