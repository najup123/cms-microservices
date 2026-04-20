package com.pujan.userservice.controller;

import com.pujan.userservice.model.Users;
import com.pujan.userservice.repository.UsersRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Utility controller for administrative tasks
 * WARNING: This endpoint should be secured or removed in production
 */
@RestController
@RequestMapping("/api/admin")
public class AdminUtilityController {

    @Autowired
    private UsersRepo usersRepo;

    /**
     * One-time script to fix null CommonTable values in existing users
     * This updates all users that have null values for entry_name, entry_type, module_name, or from_url
     */
    @PostMapping("/fix-commontable-nulls")
    public ResponseEntity<?> fixCommonTableNulls() {
        List<Users> allUsers = usersRepo.findAll();
        int updated = 0;

        for (Users user : allUsers) {
            boolean needsUpdate = false;

            if (user.getEntryName() == null || user.getEntryName().isEmpty()) {
                user.setEntryName(user.getUsername());
                needsUpdate = true;
            }

            if (user.getEntryType() == null || user.getEntryType().isEmpty()) {
                user.setEntryType("USERS");
                needsUpdate = true;
            }

            if (user.getModuleName() == null || user.getModuleName().isEmpty()) {
                user.setModuleName("USER_MANAGEMENT");
                needsUpdate = true;
            }

            if (user.getFromUrl() == null || user.getFromUrl().isEmpty()) {
                user.setFromUrl("SYSTEM");
                needsUpdate = true;
            }

            if (needsUpdate) {
                usersRepo.save(user);
                updated++;
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Updated " + updated + " users with null CommonTable values");
        response.put("totalUsers", allUsers.size());
        response.put("updatedUsers", updated);

        return ResponseEntity.ok(response);
    }

    /**
     * Check the status of CommonTable fields for all users
     */
    @GetMapping("/check-commontable-status")
    public ResponseEntity<?> checkCommonTableStatus() {
        List<Users> allUsers = usersRepo.findAll();
        int nullEntryName = 0;
        int nullEntryType = 0;
        int nullModuleName = 0;
        int nullFromUrl = 0;

        for (Users user : allUsers) {
            if (user.getEntryName() == null || user.getEntryName().isEmpty()) nullEntryName++;
            if (user.getEntryType() == null || user.getEntryType().isEmpty()) nullEntryType++;
            if (user.getModuleName() == null || user.getModuleName().isEmpty()) nullModuleName++;
            if (user.getFromUrl() == null || user.getFromUrl().isEmpty()) nullFromUrl++;
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalUsers", allUsers.size());
        response.put("nullEntryName", nullEntryName);
        response.put("nullEntryType", nullEntryType);
        response.put("nullModuleName", nullModuleName);
        response.put("nullFromUrl", nullFromUrl);

        return ResponseEntity.ok(response);
    }
}
