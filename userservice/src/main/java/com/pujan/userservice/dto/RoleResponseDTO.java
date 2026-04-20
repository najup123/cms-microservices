package com.pujan.userservice.dto;

import com.pujan.userservice.model.Role;
import com.pujan.userservice.model.RoleModuleFunction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponseDTO {
    
    private Long id;
    private String name;
    private List<ModulePermissionDTO> modules;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModulePermissionDTO {
        private Long moduleId;
        private String moduleName;        // Display Name (e.g., "Admission Program")
        private String moduleCode;         // Code (e.g., "ADMISSION")
        private List<Integer> functionIds;
    }
    
    /**
     * Convert Role entity to RoleResponseDTO
     * Groups permissions by module and collects function IDs
     */
    public static RoleResponseDTO fromEntity(Role role) {
        if (role == null) {
            return null;
        }
        
        List<ModulePermissionDTO> modules = new ArrayList<>();
        
        if (role.getPermissions() != null && !role.getPermissions().isEmpty()) {
            // Group permissions by module
            Map<Long, List<RoleModuleFunction>> permissionsByModule = role.getPermissions()
                    .stream()
                    .collect(Collectors.groupingBy(rmf -> rmf.getModule().getId()));
            
            // Convert to DTOs
            modules = permissionsByModule.entrySet().stream()
                    .map(entry -> {
                        Long moduleId = entry.getKey();
                        List<RoleModuleFunction> perms = entry.getValue();
                        
                        // Get module name and code from first permission
                        String moduleName = perms.isEmpty() ? null : 
                                perms.get(0).getModule().getDisplayName();
                        String moduleCode = perms.isEmpty() ? null :
                                perms.get(0).getModule().getCode();
                        
                        // Collect all function IDs for this module
                        List<Integer> functionIds = perms.stream()
                                .map(RoleModuleFunction::getFunctionId)
                                .distinct()
                                .sorted()
                                .collect(Collectors.toList());
                        
                        return ModulePermissionDTO.builder()
                                .moduleId(moduleId)
                                .moduleName(moduleName)
                                .moduleCode(moduleCode)
                                .functionIds(functionIds)
                                .build();
                    })
                    .sorted(Comparator.comparing(ModulePermissionDTO::getModuleId))
                    .collect(Collectors.toList());
        }
        
        return RoleResponseDTO.builder()
                .id(role.getId())
                .name(role.getName())
                .modules(modules)
                .build();
    }
    
    /**
     * Convert list of Role entities to list of RoleResponseDTOs
     */
    public static List<RoleResponseDTO> fromEntities(List<Role> roles) {
        if (roles == null) {
            return Collections.emptyList();
        }
        
        return roles.stream()
                .map(RoleResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
