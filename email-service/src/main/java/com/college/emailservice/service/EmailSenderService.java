package com.college.emailservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailSenderService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${otp.expiration.minutes:5}")
    private int otpExpirationMinutes;

    /**
     * Send OTP via email asynchronously
     */
    @Async
    public void sendOtpEmail(String toEmail, String otpCode, String purpose) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);

        String subject;
        String body;

        if ("REGISTRATION".equals(purpose)) {
            subject = "Email Verification - Your OTP Code";
            body = String.format(
                "Welcome!\n\n" +
                "Your verification code is: %s\n\n" +
                "This code will expire in %d minutes.\n\n" +
                "If you didn't request this, please ignore this email.\n\n" +
                "Best regards,\n" +
                "University of Jan Dai Team",
                otpCode, otpExpirationMinutes
            );
        } else { // PASSWORD_RESET
            subject = "Password Reset - Your OTP Code";
            body = String.format(
                "Hello,\n\n" +
                "You requested to reset your password.\n\n" +
                "Your verification code is: %s\n\n" +
                "This code will expire in %d minutes.\n\n" +
                "If you didn't request this, please ignore this email and your password will remain unchanged.\n\n" +
                "Best regards,\n" +
                "University of Jan Dai Team",
                otpCode, otpExpirationMinutes
            );
        }

        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }
}
