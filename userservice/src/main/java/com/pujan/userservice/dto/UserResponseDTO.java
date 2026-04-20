package com.pujan.userservice.dto;

import com.pujan.userservice.model.Users;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {
    private Long id;
    private String username;
    private String email;
    private List<RoleResponseDTO> roles;

    public static UserResponseDTO fromEntity(Users user) {
        if (user == null) return null;

        return UserResponseDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(user.getRoles().stream()
                        .map(RoleResponseDTO::fromEntity)
                        .collect(Collectors.toList()))
                .build();
    }
}
