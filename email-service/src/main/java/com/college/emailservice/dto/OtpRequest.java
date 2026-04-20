package com.college.emailservice.dto;

import lombok.Data;

@Data
public class OtpRequest {
    private String email;
    private String purpose; // "REGISTRATION" or "PASSWORD_RESET"
}
