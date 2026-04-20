package com.college.emailservice.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class OtpVerification extends CommonTable{
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String otpCode;
    
    @Column(nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(nullable = false)
    private boolean verified = false;
    
    @Column(nullable = false)
    private String purpose; // "REGISTRATION" or "PASSWORD_RESET"
    
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = true)
    @Builder.Default
    private Integer attempts = 0;  // Changed to nullable to support existing rows

    private LocalDateTime verifiedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    @Override
    protected String provideEntryName() {
        return this.email + ":" + this.purpose;
    }

    @Override
    protected String provideEntryType() {
        return "OTP_VERIFICATION";
    }

    @Override
    protected String provideModuleName() {
        return "EMAIL_SERVICE";
    }
}
