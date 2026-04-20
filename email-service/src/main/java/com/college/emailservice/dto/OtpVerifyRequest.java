package com.college.emailservice.dto;

import lombok.Data;

@Data
public class OtpVerifyRequest {
    private String email;
    private String otp;
    private String purpose; // "REGISTRATION" or "PASSWORD_RESET"
}
