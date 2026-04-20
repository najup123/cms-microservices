package com.pujan.userservice.dto;

import lombok.Data;
import java.util.Set;

@Data
public class UserUpdateRequest {
    private String username;
    private String email;
    private String password; // Optional
    private Set<String> roles;
}
