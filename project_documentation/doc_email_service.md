# 📚 Module Documentation: Email Service

**Role**: Notifications & Asynchronous Tasks.
**Port**: `8082` (approx), Registered as `EMAIL-SERVICE`.

---

## 📂 File Structure & Explanations

### 1. `EmailServiceApplication.java`
**Location**: `src/main/java/com/college/emailservice/EmailServiceApplication.java`
**Purpose**: Entry point.

```java
@SpringBootApplication
@EnableAsync // <--- ACTIVATES BACKGROUND THREADS
public class EmailServiceApplication { ... }
```

*   **`@EnableAsync`**: Without this, the `@Async` annotation does nothing. This turns on the thread pool.

### 2. `EmailSenderService.java`
**Location**: `src/main/java/com/college/emailservice/service/EmailSenderService.java`
**Purpose**: Sending logic.

```java
@Service
public class EmailSenderService {

    @Autowired
    private JavaMailSender mailSender; // Spring Boot's mailer

    @Async // <--- RUNS IN BACKGROUND
    public void sendEmail(String to, String body) {
        // connect to Gmail/SMTP
        // send message
        // This takes 2-5 seconds
    }
}
```

*   **`JavaMailSender`**: The interface provided by `spring-boot-starter-mail`.
*   **`@Async`**: Returns control to the caller *immediately*, then runs the code on a separate thread "worker".

### 3. `EmailController.java`
**Location**: `src/main/java/com/college/emailservice/controller/EmailController.java`
**Purpose**: API to trigger emails.

```java
@RestController
@RequestMapping("/api/email")
public class EmailController {
    
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody OtpRequest request) {
        // 1. Generate OTP
        // 2. Save OTP to DB
        // 3. call emailSenderService.sendEmail(...)
        return ResponseEntity.ok("OTP Sent"); // Returns instantly!
    }
}
```

### 4. `OtpVerification.java`
**Location**: `src/main/java/com/college/emailservice/model/OtpVerification.java`
**Purpose**: Defining OTP structure.

```java
@Entity
public class OtpVerification {
    @Id
    private Long id;
    private String email;
    private String otp;
    private LocalDateTime expiryTime; // Expiry logic
}
```

---

## ⚙️ How It Works

1.  **Trigger**: User Service (or Frontend) calls `POST /api/email/send-otp`.
2.  **Validation**: Check if email is valid format.
3.  **Logic**:
    *   Generate `123456`.
    *   Save `123456` + `john@gmail.com` + `Now + 5 mins` to Database.
4.  **Async Send**: Triggers the background email sender.
5.  **Response**: Returns HTTP 200 "Sent".
6.  **Verify**: Later, user sends `123456` back. The service checks DB:
    *   Does code match?
    *   Is time < expiryTime?
    *   If yes -> Success.

---

## 🔑 Important Syntaxes

*   **`CompletableFuture<Void>`**: Sometimes used with Async to handle return values, though `void` is common for fire-and-forget.
*   **`LocalDateTime.now().plusMinutes(5)`**: Standard Java Time API for expiry logic.
