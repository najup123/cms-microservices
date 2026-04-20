package com.pujan.userservice.controller;

import com.pujan.userservice.model.Module;
import com.pujan.userservice.model.Role;
import com.pujan.userservice.model.RoleModuleFunction;
import com.pujan.userservice.repository.ModuleRepo;
import com.pujan.userservice.repository.RoleRepo;
import com.pujan.userservice.repository.UsersRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final UsersRepo usersRepo;
    private final RoleRepo roleRepo;
    private final ModuleRepo moduleRepo;

    @GetMapping("/check")
    public ResponseEntity<Boolean> checkPermission(
            @RequestParam String username,
            @RequestParam String moduleCode,
            @RequestParam String action) {

        System.out.println("=== PermissionController.checkPermission START ===");
        System.out.println("Request params - Username: " + username + " | Module: " + moduleCode + " | Action: " + action);

        // Action mapping: CREATE->1, READ/SELECT->2, UPDATE->3, DELETE->4 (based on StaticFunction)
        int requiredFunction = mapActionToId(action);
        System.out.println("✓ Action '" + action + "' mapped to function ID: " + requiredFunction);
        
        return usersRepo.findByUsername(username)
                .map(user -> {
                    System.out.println("✓ User found: " + username);
                    System.out.println("✓ User roles count: " + user.getRoles().size());
                    
                    // Check user roles
                    for (Role role : user.getRoles()) {
                        System.out.println("  → Checking role: " + role.getName());
                        System.out.println("    Permissions count: " + role.getPermissions().size());
                        
                        for (RoleModuleFunction rmf : role.getPermissions()) {
                            String moduleCodeFromDB = rmf.getModule().getCode();
                            int functionIdFromDB = rmf.getFunctionId();
                            
                            System.out.println("    → Permission: Module='" + moduleCodeFromDB + "' | Function=" + functionIdFromDB);
                            
                            if (rmf.getModule().getCode().equalsIgnoreCase(moduleCode)) {
                                System.out.println("      ✓ Module code MATCH!");
                                
                                if (rmf.getFunctionId() == requiredFunction) {
                                    System.out.println("      ✓ Function ID MATCH!");
                                    System.out.println("✅ ACCESS GRANTED");
                                    System.out.println("=== PermissionController.checkPermission END ===\n");
                                    return true;
                                } else {
                                    System.out.println("      ✗ Function ID mismatch (has " + functionIdFromDB + ", needs " + requiredFunction + ")");
                                }
                            } else {
                                System.out.println("      ✗ Module code mismatch (has '" + moduleCodeFromDB + "', needs '" + moduleCode + "')");
                            }
                        }
                    }
                    System.err.println("❌ ACCESS DENIED - No matching permission found");
                    System.err.println("   User has " + user.getRoles().size() + " role(s)");
                    System.err.println("   Required: Module='" + moduleCode + "' | Action='" + action + "' (Function ID: " + requiredFunction + ")");
                    System.out.println("=== PermissionController.checkPermission END ===\n");
                    return false;
                })
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    System.err.println("❌ User NOT FOUND: " + username);
                    System.out.println("=== PermissionController.checkPermission END ===\n");
                    return ResponseEntity.ok(false);
                });
    }

    private int mapActionToId(String action) {
        // CRITICAL: This mapping MUST match StaticFunction constants exactly
        // StaticFunction: SELECT=1, UPDATE=2, CREATE=3, DELETE=4
        switch (action.toUpperCase()) {
            case "SELECT": return 1;  // StaticFunction.SELECT
            case "UPDATE": return 2;  // StaticFunction.UPDATE
            case "CREATE": return 3;  // StaticFunction.CREATE
            case "DELETE": return 4;  // StaticFunction.DELETE
            default: return 0;
        }
    }
}
