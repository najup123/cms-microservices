package com.pujan.userservice.dto;


import lombok.Data;
import java.util.Set;

@Data
public class SignupRequest {
    private String username;
    private String email;
    private String password;
    private Set<String> roles; // Accepts ["admin", "user"] instead of objects
}
