package com.pujan.userservice.service;

import com.pujan.userservice.model.Module;
import com.pujan.userservice.model.Role;
import com.pujan.userservice.model.RoleModuleFunction;
import com.pujan.userservice.repository.ModuleRepo;
import com.pujan.userservice.repository.RoleRepo;
import com.pujan.userservice.dto.RoleCreationDTO;
import com.pujan.userservice.rbac.StaticFunction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RoleService {

    @Autowired
    private RoleRepo roleRepo;

    @Autowired
    private ModuleRepo moduleRepo;

    public Role createRoleWithPermissions(RoleCreationDTO dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Role name is required");
        }

        String formattedName = formatRoleName(dto.getName());

        if (roleRepo.findByName(formattedName).isPresent()) {
            throw new IllegalArgumentException("Role already exists");
        }

        Role role = Role.builder()
                .name(formattedName)
                .build();

        // Attach permissions if provided
        if (dto.getModules() != null) {
            for (RoleCreationDTO.ModulePermissionDTO mp : dto.getModules()) {
                if (mp.getFunctionIds() == null || mp.getFunctionIds().isEmpty()) {
                    continue;
                }

                Module module = moduleRepo.findById(mp.getModuleId())
                        .orElseThrow(() -> new IllegalArgumentException("Module not found: " + mp.getModuleId()));

                for (Integer functionId : mp.getFunctionIds()) {
                    if (functionId == null) continue;
                    RoleModuleFunction rmf = RoleModuleFunction.builder()
                            .role(role)
                            .module(module)
                            .functionId(functionId)
                            .build();
                    role.getPermissions().add(rmf);
                }
            }
        }

        return roleRepo.save(role);
    }

    private String formatRoleName(String rawName) {
        String name = rawName.trim().toUpperCase();
        if (!name.startsWith("ROLE_")) {
            name = "ROLE_" + name;
        }
        return name;
    }

    private String normalizeModuleKey(Module module) {
        String base;
        if (module.getCode() != null && !module.getCode().isBlank()) {
            base = module.getCode();
        } else {
            base = module.getDisplayName();
        }
        if (base == null) {
            return "UNKNOWN";
        }
        return base.trim().replaceAll("\\s+", "_").toUpperCase();
    }

    public List<String> getPermissionStringsForRole(String roleName) {
        Role role = roleRepo.findByNameWithPermissions(roleName).orElse(null);
        if (role == null || role.getPermissions() == null) {
            return Collections.emptyList();
        }

        return role.getPermissions().stream()
                .filter(Objects::nonNull)
                .map(rmf -> {
                    String moduleKey = normalizeModuleKey(rmf.getModule());
                    String functionName = StaticFunction.getName(rmf.getFunctionId());
                    return moduleKey + ":" + functionName;
                })
                .distinct()
                .collect(Collectors.toList());
    }

    public List<SimpleGrantedAuthority> getAuthoritiesForRole(String roleName) {
        return getPermissionStringsForRole(roleName).stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }
    
    public Optional<Module> getModuleById(Long id) {
        return moduleRepo.findById(id);
    }

    /**
     * Check if a role is assigned to any users
     * @param roleId the role ID to check
     * @return true if any users have this role, false otherwise
     */
    public boolean isRoleAssignedToUsers(Long roleId) {
        return roleRepo.countUsersWithRole(roleId) > 0;
    }

    /**
     * Get all roles with their permissions eagerly loaded
     * @return list of roles with permissions
     */
    public List<Role> getAllRolesWithPermissions() {
        return roleRepo.findAllWithPermissions();
    }

    /**
     * Get a single role with permissions by ID
     * @param id the role ID
     * @return Optional containing the role with permissions if found
     */
    public Optional<Role> getRoleWithPermissions(Long id) {
        return roleRepo.findById(id).map(role -> {
            // Force initialization of permissions
            role.getPermissions().size();
            return role;
        });
    }
}
