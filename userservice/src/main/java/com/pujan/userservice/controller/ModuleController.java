package com.pujan.userservice.controller;

import com.pujan.userservice.model.Module;
import com.pujan.userservice.model.RoleModuleFunction;
import com.pujan.userservice.repository.ModuleRepo;
import com.pujan.userservice.repository.RoleRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/modules")
public class ModuleController {

    private static final Logger logger = LoggerFactory.getLogger(ModuleController.class);

    @Autowired
    private ModuleRepo moduleRepo;

    @Autowired
    private RoleRepo roleRepo;

    @Autowired
    private RestTemplate restTemplate;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<Module>> getAllModules() {
        List<Module> modules = moduleRepo.findAll();
        return ResponseEntity.ok(modules);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Module> getModuleById(@PathVariable Long id) {
        return moduleRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }



    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> createModule(@RequestBody Map<String, String> payload) {
        String displayName = payload.get("displayName");
        String code = payload.get("code");

        if (displayName == null || displayName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Display name is required");
        }

        String normalizedDisplayName = displayName.trim();
        String normalizedCode = normalizeCode(code, normalizedDisplayName);

        if (moduleRepo.existsByDisplayName(normalizedDisplayName)) {
            return ResponseEntity.badRequest().body("Module with this display name already exists");
        }

        if (normalizedCode != null && moduleRepo.existsByCode(normalizedCode)) {
            return ResponseEntity.badRequest().body("Module with this code already exists");
        }

        Module module = Module.builder()
                .displayName(normalizedDisplayName)
                .code(normalizedCode)
                .build();

        Module savedModule = moduleRepo.save(module);

        // Auto-assign permissions to SUPER_ADMIN
        roleRepo.findByName("ROLE_SUPER_ADMIN").ifPresent(role -> {
            Set<RoleModuleFunction> newPermissions = new java.util.HashSet<>();
            
            // Assign Create(1), Select(2), Update(3), Delete(4)
            for (int i = 1; i <= 4; i++) {
                com.pujan.userservice.model.RoleModuleFunction rmf = com.pujan.userservice.model.RoleModuleFunction.builder()
                        .role(role)
                        .module(savedModule)
                        .functionId(i)
                        .build();
                newPermissions.add(rmf);
            }
            
            role.getPermissions().addAll(newPermissions);
            roleRepo.save(role);
        });

        // Auto-create schema in CMS service
        try {
            String cmsServiceUrl = "http://cms-service/api/schema/auto-create";
            Map<String, String> schemaPayload = new java.util.HashMap<>();
            schemaPayload.put("moduleCode", normalizedCode);
            schemaPayload.put("displayName", normalizedDisplayName);
            
            logger.info("Creating schema for module: {} ({})", normalizedDisplayName, normalizedCode);
            ResponseEntity<Map> schemaResponse = restTemplate.postForEntity(
                cmsServiceUrl, 
                schemaPayload, 
                Map.class
            );
            logger.info("Schema created successfully for module: {}", normalizedCode);
        } catch (Exception e) {
            // Log error but don't fail module creation
            logger.error("Failed to auto-create schema for module {}: {}", normalizedCode, e.getMessage());
            logger.warn("Module created but schema creation failed. Please create schema manually.");
        }

        return ResponseEntity.ok(savedModule);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> updateModule(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return moduleRepo.findById(id)
                .map(existing -> {
                    String displayName = payload.get("displayName");
                    String code = payload.get("code");

                    if (displayName != null && !displayName.trim().isEmpty()) {
                        String normalizedDisplayName = displayName.trim();
                        if (!normalizedDisplayName.equals(existing.getDisplayName())
                                && moduleRepo.existsByDisplayName(normalizedDisplayName)) {
                            return ResponseEntity.badRequest().body("Module with this display name already exists");
                        }
                        existing.setDisplayName(normalizedDisplayName);
                    }

                    if (code != null) {
                        String normalizedCode = normalizeCode(code, existing.getDisplayName());
                        if (normalizedCode != null && !normalizedCode.equals(existing.getCode())
                                && moduleRepo.existsByCode(normalizedCode)) {
                            return ResponseEntity.badRequest().body("Module with this code already exists");
                        }
                        existing.setCode(normalizedCode);
                    }

                    Module saved = moduleRepo.save(existing);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteModule(@PathVariable Long id) {
        if (!moduleRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        moduleRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/fix-permissions")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> fixPermissions() {
        roleRepo.findByName("ROLE_SUPER_ADMIN").ifPresent(role -> {
            List<Module> allModules = moduleRepo.findAll();
            Set<RoleModuleFunction> newPermissions = new java.util.HashSet<>();

            for (Module module : allModules) {
                // Assign Create(1), Select(2), Update(3), Delete(4)
                for (int i = 1; i <= 4; i++) {
                    // Check if permission already exists to avoid duplicates
                    int finalI = i;
                    boolean exists = role.getPermissions().stream().anyMatch(p ->
                        p.getModule().getId().equals(module.getId()) && p.getFunctionId() == finalI
                    );

                    if (!exists) {
                        RoleModuleFunction rmf = RoleModuleFunction.builder()
                                .role(role)
                                .module(module)
                                .functionId(i)
                                .build();
                        newPermissions.add(rmf);
                    }
                }
            }

            if (!newPermissions.isEmpty()) {
                role.getPermissions().addAll(newPermissions);
                roleRepo.save(role);
            }
        });

        return ResponseEntity.ok(Map.of("message", "Permissions fixed successfully"));
    }

    private String normalizeCode(String code, String fallbackDisplayName) {
        String base = null;
        if (code != null && !code.trim().isEmpty()) {
            base = code.trim();
        } else if (fallbackDisplayName != null && !fallbackDisplayName.trim().isEmpty()) {
            base = fallbackDisplayName.trim();
        }

        if (base == null) {
            return null;
        }

        return base.replaceAll("\\s+", "_").toUpperCase();
    }
}
