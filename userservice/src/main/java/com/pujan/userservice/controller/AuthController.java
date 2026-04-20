package com.pujan.userservice.controller;

import com.pujan.userservice.model.Role;
import com.pujan.userservice.model.Users;
import com.pujan.userservice.repository.RoleRepo;
import com.pujan.userservice.repository.UsersRepo;
import com.pujan.userservice.dto.SignupRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
public class AuthController {

    @Autowired
    private UsersRepo usersRepo;

    @Autowired
    private RoleRepo roleRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.web.client.RestTemplate restTemplate;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(
            @RequestBody SignupRequest signUpRequest,
            jakarta.servlet.http.HttpServletRequest request) {
        if (usersRepo.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }

        Users user = new Users();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));

        Set<String> strRoles = signUpRequest.getRoles();
        Set<Role> roles = new HashSet<>();

        if (strRoles == null || strRoles.isEmpty()) {
            Role userRole = roleRepo.findByName("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("Error: Default Role ROLE_USER is not found."));
            roles.add(userRole);
        } else {
            strRoles.forEach(roleName -> {
                // Handle "admin" -> "ROLE_ADMIN" conversion
                String normalizedName = roleName.trim();
                if (!normalizedName.toUpperCase().startsWith("ROLE_")) {
                    normalizedName = "ROLE_" + normalizedName.toUpperCase();
                } else {
                    normalizedName = normalizedName.toUpperCase();
                }

                String finalName = normalizedName;
                Role role = roleRepo.findByName(finalName)
                        .orElseThrow(() -> new RuntimeException("Error: Role " + finalName + " is not found."));
                roles.add(role);
            });
        }

        user.setRoles(roles);
        
        // CommonTable Fields
        user.setEntryName(signUpRequest.getUsername());
        user.setEntryType("USER");
        user.setModuleName("USER_MANAGEMENT");
        user.setFromUrl(request.getHeader("Referer"));
        
        usersRepo.save(user);

        return ResponseEntity.ok("User registered successfully!");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        String newPassword = payload.get("newPassword");

        if (email == null || otp == null || newPassword == null) {
            return ResponseEntity.badRequest().body("Email, OTP, and New Password are required.");
        }

        // Verify OTP via Email Service
        try {
            String verifyUrl = "http://email-service/api/otp/validate-verified";
            java.util.Map<String, String> verifyRequest = new java.util.HashMap<>();
            verifyRequest.put("email", email);
            verifyRequest.put("otp", otp);
            verifyRequest.put("purpose", "PASSWORD_RESET");

            ResponseEntity<java.util.Map> verifyResponse = restTemplate.postForEntity(verifyUrl, verifyRequest, java.util.Map.class);

            if (verifyResponse.getStatusCode().is2xxSuccessful() && Boolean.TRUE.equals(verifyResponse.getBody().get("verified"))) {
                // OTP Valid, update password
                Users user = usersRepo.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
                
                user.setPassword(passwordEncoder.encode(newPassword));
                usersRepo.save(user);
                
                return ResponseEntity.ok("Password has been reset successfully.");
            } else {
                return ResponseEntity.badRequest().body("Invalid OTP or OTP expired.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error verifying OTP: " + e.getMessage());
        }
    }
}