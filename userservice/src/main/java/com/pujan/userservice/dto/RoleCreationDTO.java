package com.pujan.userservice.dto;

import lombok.Data;

import java.util.List;

@Data
public class RoleCreationDTO {

    private String name;
    private String description;
    private List<ModulePermissionDTO> modules;

    @Data
    public static class ModulePermissionDTO {
        private Long moduleId;
        private List<Integer> functionIds; // 1=SELECT, 2=UPDATE, 3=CREATE, 4=DELETE
    }
}
