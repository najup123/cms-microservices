package com.college.emailservice.controller;

import com.college.emailservice.dto.OtpRequest;
import com.college.emailservice.dto.OtpVerifyRequest;
import com.college.emailservice.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/otp")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class OtpController {
    
    private final OtpService otpService;
    
    /**
     * Request OTP - sends OTP to email
     */
    @PostMapping("/request")
    public ResponseEntity<?> requestOtp(@RequestBody OtpRequest request) {
        try {
            // Validate purpose
            if (!request.getPurpose().equals("REGISTRATION") && 
                !request.getPurpose().equals("PASSWORD_RESET")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid purpose"));
            }
            
            otpService.generateOtp(request.getEmail(), request.getPurpose());
            
            return ResponseEntity.ok(Map.of(
                "message", "OTP sent to email",
                "email", request.getEmail()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("message", "Failed to send OTP: " + e.getMessage()));
        }
    }
    
    /**
     * Verify OTP
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerifyRequest request) {
        boolean isValid = otpService.verifyOtp(
            request.getEmail(), 
            request.getOtp(), 
            request.getPurpose()
        );
        
        if (isValid) {
            return ResponseEntity.ok(Map.of(
                "message", "OTP verified successfully",
                "verified", true
            ));
        } else {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "message", "Invalid or expired OTP",
                    "verified", false
                ));
        }
    }
    /**
     * Validate Verified OTP (Consume it)
     */
    @PostMapping("/validate-verified")
    public ResponseEntity<?> validateVerifiedOtp(@RequestBody OtpVerifyRequest request) {
        boolean isValid = otpService.validateVerifiedOtp(
            request.getEmail(), 
            request.getOtp(), 
            request.getPurpose()
        );
        
        if (isValid) {
            return ResponseEntity.ok(Map.of(
                "message", "OTP verified and consumed successfully",
                "verified", true
            ));
        } else {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "message", "Invalid, expired, or unverified OTP",
                    "verified", false
                ));
        }
    }
}
