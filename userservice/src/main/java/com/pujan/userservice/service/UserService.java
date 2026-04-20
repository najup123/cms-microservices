package com.pujan.userservice.service;

import com.pujan.userservice.model.Role;
import com.pujan.userservice.model.Users;
import com.pujan.userservice.repository.RoleRepo;
import com.pujan.userservice.repository.UsersRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class UserService {

    @Autowired
    private UsersRepo usersRepo;

    @Autowired
    private RoleRepo roleRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<Users> getAllUsers() {
        return usersRepo.findAll();
    }

    public Optional<Users> getUserById(Long id) {
        return usersRepo.findById(id);
    }

    public Optional<Users> getUserByUsername(String username) {
        return usersRepo.findByUsername(username);
    }

    public Users createUser(Users user) {
        // Encode password if provided
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        // Set default role if no roles provided
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            Set<Role> roles = new HashSet<>();
            Role userRole = roleRepo.findByName("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("Default role not found"));
            roles.add(userRole);
            user.setRoles(roles);
        }

        return usersRepo.save(user);
    }

    public Users updateUser(Long id, Users userDetails) {
        Users user = usersRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setUsername(userDetails.getUsername());
        user.setEmail(userDetails.getEmail());

        // Update password only if provided
        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }

        // Update roles if provided
        if (userDetails.getRoles() != null) {
            user.setRoles(userDetails.getRoles());
        }

        return usersRepo.save(user);
    }

    public void deleteUser(Long id) {
        Users user = usersRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        usersRepo.delete(user);
    }

    public boolean isCurrentUserSuperAdmin() {
        org.springframework.security.core.Authentication authentication = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
