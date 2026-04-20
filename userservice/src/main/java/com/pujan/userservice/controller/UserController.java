package com.pujan.userservice.controller;

import com.pujan.userservice.dto.UserResponseDTO;
import com.pujan.userservice.model.Role;
import com.pujan.userservice.model.Users;
import com.pujan.userservice.repository.RoleRepo;
import com.pujan.userservice.repository.UsersRepo;
import com.pujan.userservice.service.UserService;
import com.pujan.userservice.dto.UserUpdateRequest;

import com.pujan.userservice.dto.SignupRequest;
import com.pujan.userservice.util.JwtUtils;
import com.pujan.userservice.service.CustomUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private RoleRepo roleRepo;

    @Autowired
    private UsersRepo usersRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @GetMapping
    @PreAuthorize("hasPermission('User Management', 'SELECT') or hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Users>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponseDTO> getCurrentUser() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getUserByUsername(username)
                .map(UserResponseDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Users> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody SignupRequest signUpRequest) {
        if (usersRepo.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }

        // Security Check: Only SUPER_ADMIN can create a SUPER_ADMIN
        boolean isRequestingSuperAdmin = false;
        if (signUpRequest.getRoles() != null) {
            for (String roleName : signUpRequest.getRoles()) {
                if (roleName.trim().toUpperCase().contains("SUPER_ADMIN")) {
                    isRequestingSuperAdmin = true;
                    break;
                }
            }
        }

        if (isRequestingSuperAdmin) {
            if (!userService.isCurrentUserSuperAdmin()) {
                return ResponseEntity.status(403).body("Error: Only SUPER_ADMIN can create a SUPER_ADMIN user.");
            }
        }

        Users user = new Users();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        // Password encoding is handled in UserService.createUser()
        user.setPassword(signUpRequest.getPassword());

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
        Users savedUser = userService.createUser(user);

        return ResponseEntity.ok(savedUser);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest userDto) {
         // Security Check: Only SUPER_ADMIN can assign SUPER_ADMIN role
        if (userDto.getRoles() != null) {
             boolean isRequestingSuperAdmin = false;
             for (String roleName : userDto.getRoles()) {
                 if (roleName.trim().toUpperCase().contains("SUPER_ADMIN")) {
                     isRequestingSuperAdmin = true;
                     break;
                 }
             }

             if (isRequestingSuperAdmin) {
                 if (!userService.isCurrentUserSuperAdmin()) {
                     return ResponseEntity.status(403).body("Error: Only SUPER_ADMIN can assign SUPER_ADMIN role.");
                 }
             }
        }

        // Check if the current user is updating themselves and if the username has changed
        String currentUsername = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isSelfUpdate = false;
        boolean usernameChanged = false;

        java.util.Optional<Users> existingUserOpt = userService.getUserById(id);
        if (existingUserOpt.isPresent()) {
            Users existingUser = existingUserOpt.get();
            if (existingUser.getUsername().equals(currentUsername)) {
                isSelfUpdate = true;
            }
            if (userDto.getUsername() != null && !userDto.getUsername().equals(existingUser.getUsername())) {
                usernameChanged = true;
            }
        }
        
        final boolean finalIsSelfUpdate = isSelfUpdate;
        final boolean finalUsernameChanged = usernameChanged;

        return userService.getUserById(id).map(existingUser -> {
            // Create a new Users object with only the fields we want to update
            Users userToUpdate = new Users();
            
            // Update basic info
            if (userDto.getUsername() != null) {
                userToUpdate.setUsername(userDto.getUsername());
            } else {
                userToUpdate.setUsername(existingUser.getUsername());
            }
            
            if (userDto.getEmail() != null) {
                userToUpdate.setEmail(userDto.getEmail());
            } else {
                userToUpdate.setEmail(existingUser.getEmail());
            }

            // IMPORTANT: Set password to null to prevent double-encoding
            // The service will only encode if a new password is provided
            userToUpdate.setPassword(null);

            // Update Roles if provided
            if (userDto.getRoles() != null) {
                Set<Role> newRoles = new HashSet<>();
                userDto.getRoles().forEach(roleName -> {
                    // Handle "admin" -> "ROLE_ADMIN" conversion
                    String normalizedName = roleName.trim();
                    if (!normalizedName.toUpperCase().startsWith("ROLE_")) {
                        normalizedName = "ROLE_" + normalizedName.toUpperCase();
                    } else {
                        normalizedName = normalizedName.toUpperCase();
                    }

                    String finalName = normalizedName;
                    Role role = roleRepo.findByName(finalName)
                            .orElseThrow(() -> new RuntimeException("Role not found: " + finalName));
                    newRoles.add(role);
                });
                userToUpdate.setRoles(newRoles);
            } else {
                userToUpdate.setRoles(existingUser.getRoles());
            }

            Users updatedUser = userService.updateUser(id, userToUpdate);
            
            // If username changed for self, generate new token
            if (finalIsSelfUpdate && finalUsernameChanged) {
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(updatedUser.getUsername());
                String newToken = jwtUtils.generateTokenFromUsername(userDetails);
                
                java.util.Map<String, Object> response = new java.util.HashMap<>();
                response.put("user", updatedUser);
                response.put("token", newToken);
                return ResponseEntity.ok(response);
            }

            return ResponseEntity.ok(updatedUser);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> resetUserPassword(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload) {
        String newPassword = payload.get("password");
        
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Password is required");
        }
        
        return userService.getUserById(id).map(user -> {
            // Encode the new password
            user.setPassword(passwordEncoder.encode(newPassword));
            usersRepo.save(user);
            return ResponseEntity.ok().body("Password reset successfully");
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!usersRepo.existsById(id)) {
             return ResponseEntity.notFound().build();
        }
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}