package com.college.emailservice.repository;

import com.college.emailservice.model.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OtpVerificationRepo extends JpaRepository<OtpVerification, Long> {
    
    Optional<OtpVerification> findTopByEmailAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(
        String email, String purpose
    );

    Optional<OtpVerification> findTopByEmailAndPurposeAndVerifiedTrueOrderByCreatedAtDesc(
        String email, String purpose
    );
    
    void deleteByEmailAndPurpose(String email, String purpose);
}
