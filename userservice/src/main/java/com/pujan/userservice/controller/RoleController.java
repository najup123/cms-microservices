package com.pujan.userservice.controller;

import com.pujan.userservice.model.Role;
import com.pujan.userservice.model.RoleModuleFunction;
import com.pujan.userservice.repository.RoleRepo;
import com.pujan.userservice.service.RoleService;
import com.pujan.userservice.dto.RoleCreationDTO;
import com.pujan.userservice.dto.RoleResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private RoleRepo roleRepo;

    @Autowired
    private RoleService roleService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<RoleResponseDTO>> getAllRoles() {
        List<Role> roles = roleService.getAllRolesWithPermissions();
        List<RoleResponseDTO> response = RoleResponseDTO.fromEntities(roles);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<RoleResponseDTO> getRoleById(@PathVariable Long id) {
        return roleService.getRoleWithPermissions(id)
                .map(RoleResponseDTO::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> createRole(@RequestBody RoleCreationDTO payload) {
        try {
            Role saved = roleService.createRoleWithPermissions(payload);
            RoleResponseDTO response = RoleResponseDTO.fromEntity(saved);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody RoleCreationDTO payload) {
        if (payload.getName() == null || payload.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Role name is required");
        }

        try {
            Role existing = roleRepo.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Role not found"));

            String formattedName = formatRoleName(payload.getName());

            // Check if name is being changed to an existing role name
            if (!existing.getName().equals(formattedName)
                    && roleRepo.findByName(formattedName).isPresent()) {
                return ResponseEntity.badRequest().body("Role with name '" + formattedName + "' already exists");
            }

            // Update name
            existing.setName(formattedName);

            // Clear existing permissions (cascade will delete orphaned RoleModuleFunction entities)
            existing.getPermissions().clear();
            
            // Flush the changes to ensure orphaned entities are removed
            roleRepo.saveAndFlush(existing);

            // Add new permissions if provided
            if (payload.getModules() != null) {
                for (RoleCreationDTO.ModulePermissionDTO mp : payload.getModules()) {
                    if (mp.getFunctionIds() == null || mp.getFunctionIds().isEmpty()) {
                        continue;
                    }

                    // Fetch module
                    Long moduleId = mp.getModuleId();
                    roleService.getModuleById(moduleId).ifPresent(module -> {
                        for (Integer functionId : mp.getFunctionIds()) {
                            if (functionId == null) continue;
                            RoleModuleFunction rmf = RoleModuleFunction.builder()
                                    .role(existing)
                                    .module(module)
                                    .functionId(functionId)
                                    .build();
                            existing.getPermissions().add(rmf);
                        }
                    });
                }
            }

            Role saved = roleRepo.save(existing);
            RoleResponseDTO response = RoleResponseDTO.fromEntity(saved);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body("Failed to update role: " + ex.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> deleteRole(@PathVariable Long id) {
        if (!roleRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        // Check if role is assigned to any users
        if (roleService.isRoleAssignedToUsers(id)) {
            long userCount = roleRepo.countUsersWithRole(id);
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Cannot delete role. It is currently assigned to " + userCount + " user(s). Please remove this role from all users before deleting.");
        }

        roleRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String formatRoleName(String rawName) {
        String name = rawName.trim().toUpperCase();
        if (!name.startsWith("ROLE_")) {
            name = "ROLE_" + name;
        }
        return name;
    }
}
