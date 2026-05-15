package com.meddelivery.meddelivery.config;

import com.meddelivery.meddelivery.model.User;
import com.meddelivery.meddelivery.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the default ADMIN account on startup if it doesn't already exist.
 * Credentials: admin@meddelivery.com / Admin@123
 */
@Component
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AdminSeeder(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        String adminEmail = "admin@meddelivery.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setName("Admin");
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setRole(User.Role.ADMIN);
            admin.setActive(true);
            userRepository.save(admin);
            System.out.println("[AdminSeeder] ✅ Default admin account created: " + adminEmail);
        } else {
            System.out.println("[AdminSeeder] ℹ  Admin account already exists, skipping seed.");
        }
    }
}
