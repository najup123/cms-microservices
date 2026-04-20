# 📚 Module Documentation: User Service

**Role**: Identity Provider (IdP) & RBAC Manager.
**Port**: `9092` (approx), Registered as `USERSERVICE`.

---

## 📂 File Structure & Explanations

### 1. `Users.java` & `Role.java`
**Location**: `src/main/java/com/pujan/userservice/model/...`
**Purpose**: Data Models.

```java
@Entity
@SuperBuilder // <--- Allows builder pattern with inheritance
public class Users extends CommonTable {
    private String username;
    private String password;
    
    @ManyToMany(fetch = FetchType.EAGER) // Load roles immediately
    private Set<Role> roles;
}
```

*   **`@ManyToMany`**: A user can have many roles, a role can belong to many users.
*   **`FetchType.EAGER`**: When loading a User, load their Roles too. We need them for the JWT.

### 2. `SecurityConfig.java`
**Location**: `src/main/java/com/pujan/userservice/config/SecurityConfig.java`
**Purpose**: Internal Security.

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http
            .csrf().disable() // logic API doesn't need CSRF cookie logic
            .authorizeHttpRequests()
            .requestMatchers("/api/auth/**").permitAll() // Login/Register is public
            .anyRequest().authenticated() // Everything else needs token
            .and()
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
            
        return http.build();
    }
}
```

### 3. `JwtUtils.java`
**Location**: `src/main/java/com/pujan/userservice/util/JwtUtils.java`
**Purpose**: Token Generation. (Detailed in Code Deep Dive).

### 4. `AuthController.java`
**Location**: `src/main/java/com/pujan/userservice/controller/AuthController.java`
**Purpose**: Login Logic.

```java
public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
    // 1. Authenticate with Spring Security Manager
    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
    );
    
    // 2. Generate Token
    String jwt = jwtUtils.generateToken(authentication);
    
    // 3. Return Token
    return ResponseEntity.ok(new JwtResponse(jwt, ...));
}
```

---

## ⚙️ How It Works (The Authorization Flow)

1.  **Login**: User sends `username/password`.
2.  **Verify**: `DaoAuthenticationProvider` hashes the password and compares with DB.
3.  **Issue**: If valid, `JwtUtils` creates a signed token containing the user's roles.
4.  **Protect**: For future requests (e.g., `/me`), `JwtAuthFilter` intercepts, reads the token, and sets the Security Context so the Controller knows who is calling.

---

## 🔑 Important Syntaxes

*   **`BCryptPasswordEncoder`**: The standard for password hashing. Never store plain text.
*   **`@PreAuthorize("hasRole('ADMIN')")`**: Method-level security.
*   **`UserDetailsService`**: The interface Spring uses to "look up" a user from your custom DB.
