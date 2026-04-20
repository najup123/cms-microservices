package com.college.emailservice.service;

import com.college.emailservice.model.OtpVerification;
import com.college.emailservice.repository.OtpVerificationRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OtpService {
    
    private final OtpVerificationRepo otpRepo;
    private final EmailSenderService emailSenderService;
    
    @Value("${otp.expiration.minutes:5}")
    private int otpExpirationMinutes;
    
    @Value("${otp.length:6}")
    private int otpLength;
    
    private static final SecureRandom random = new SecureRandom();
    
    /**
     * Generate and send OTP to email
     */
    @Transactional
    public String generateOtp(String email, String purpose) {
        // Invalidate any existing OTPs for this email and purpose
        otpRepo.deleteByEmailAndPurpose(email, purpose);
        
        // Generate random OTP
        String otpCode = generateRandomOtp();
        
        // Calculate expiration time
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(otpExpirationMinutes);
        
        // Save OTP to database
        OtpVerification otp = OtpVerification.builder()
                .email(email)
                .otpCode(otpCode)
                .expiresAt(expiresAt)
                .purpose(purpose)
                .verified(false)
                .build();
        
        otpRepo.save(otp);
        
        // Send email asynchronously
        emailSenderService.sendOtpEmail(email, otpCode, purpose);
        
        return otpCode;
    }
    
    /**
     * Verify OTP
     */
    @Transactional
    public boolean verifyOtp(String email, String otpCode, String purpose) {
        Optional<OtpVerification> otpOpt = otpRepo
                .findTopByEmailAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(email, purpose);
        
        if (otpOpt.isEmpty()) {
            return false;
        }
        
        OtpVerification otp = otpOpt.get();
        
        // Check if expired
        if (otp.isExpired()) {
            return false;
        }

        // Check attempts limit (MAX 3)
        // Handle null possibility for legacy data
        int currentAttempts = otp.getAttempts() != null ? otp.getAttempts() : 0;
        
        if (currentAttempts >= 3) {
            return false;
        }
        
        // Check if OTP matches
        if (!otp.getOtpCode().equals(otpCode)) {
            // Increment attempts
            otp.setAttempts(currentAttempts + 1);
            otpRepo.save(otp);
            return false;
        }
        
        // Mark as verified
        otp.setVerified(true);
        otp.setVerifiedAt(LocalDateTime.now());
        otpRepo.save(otp);
        
        return true;
    }
    
    /**
     * Validate a previously verified OTP (consume it)
     */
    @Transactional
    public boolean validateVerifiedOtp(String email, String otpCode, String purpose) {
        Optional<OtpVerification> otpOpt = otpRepo
                .findTopByEmailAndPurposeAndVerifiedTrueOrderByCreatedAtDesc(email, purpose);
        
        if (otpOpt.isEmpty()) {
            return false;
        }
        
        OtpVerification otp = otpOpt.get();
        
        // Check if OTP matches
        if (!otp.getOtpCode().equals(otpCode)) {
            return false;
        }
        
        // Check if verify was recent (e.g., within 15 minutes)
        if (otp.getVerifiedAt().plusMinutes(15).isBefore(LocalDateTime.now())) {
            return false;
        }
        
        // Consumption: Delete the OTP so it cannot be used again
        otpRepo.delete(otp);
        
        return true;
    }

    /**
     * Generate random numeric OTP
     */
    private String generateRandomOtp() {
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < otpLength; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }
}

