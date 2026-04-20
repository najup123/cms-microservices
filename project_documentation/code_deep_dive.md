# 🧠 Code Deep Dive: Inside the University Microservices

This document is your technical reference. It goes deeper than the Masterclass, explaining **syntax** and **line-by-line responsibility**. Use this when you are writing the code.

---

## 🚪 Module 1: The Gateway Service
**Location**: `C:/Microservices/gateway-service`

### `AuthenticationFilter.java`
**Path**: `src/main/java/com/college/gateway/filter/AuthenticationFilter.java`
**Role**: The "Bouncer". It checks every request before letting it in.

#### Key Code & Syntax Logic
```java
// 1. @Component -> Makes this class a Bean managed by Spring (so we can inject it elsewhere).
@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    // 2. @Value -> Reads "jwt.secret" from application.yml. We need the secret key to inspect the ID card.
    @Value("${jwt.secret}")
    private String secret;

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            // 3. exchange.getRequest() -> The incoming HTTP request.
            ServerHttpRequest request = exchange.getRequest();

            // 4. Checking for Authorization Header
            if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                // Return 401 Unauthorized if missing
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // 5. Jwts.parser() -> The Library logic to open the token safely.
            // .verifyWith(key) ensures the token wasn't fake-signed by someone else.
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            // 6. MUTATION (Critical!)
            // We create a NEW request (modifiedRequest) based on the old one, but we add Headers.
            // Why? Because the internal services (Userservice) need the User ID but shouldn't have to re-decode the token.
            ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                    .header("X-User-Id", claims.getSubject()) 
                    .build();

            // 7. Chain.filter -> Pass the MODIFIED request to the next step (the actual service).
            return chain.filter(exchange.mutate().request(modifiedRequest).build());
        };
    }
}
```

---

## 👤 Module 2: The User Service
**Location**: `C:/Microservices/userservice`

### `JwtUtils.java`
**Path**: `src/main/java/com/pujan/userservice/util/JwtUtils.java`
**Role**: The "ID Card Printer". Creates the Token.

#### Key Code & Syntax Logic
```java
@Component
public class JwtUtils {

    // 1. generateTokenFromUsername -> Called when User logs in.
    public String generateTokenFromUsername(UserDetails userDetails){
        
        // 2. Stream & Map -> Modern Java way to loop through roles.
        List<Object> roles = userDetails.getAuthorities().stream()
                .map(authority -> {
                    String roleName = authority.getAuthority();
                    // 3. OPTIMIZATION LOGIC
                    // We don't want to store "USER_MANAGEMENT:CREATE" (22 chars).
                    // We store "USER_MANAGEMENT:3" (17 chars). Small savings add up.
                    // StaticFunction.getId("CREATE") returns 3.
                    if (roleName.contains(":")) {
                        // ... splitting logic ...
                        return parts[0] + ":" + id;
                    }
                    return id != -1 ? id : roleName; 
                })
                .collect(Collectors.toList());

        // 4. Jwts.builder() -> Actually creates the string.
        return Jwts.builder()
                .subject(userDetails.getUsername()) // "Who is this?"
                .claim("roles", roles)              // "What can they do?"
                .issuedAt(new Date())               // "When was this printed?"
                .expiration(new Date(...))          // "When does it expire?"
                .signWith(key)                      // "Official Stamp"
                .compact();
    }
}
```

### `UserController.java`
**Path**: `src/main/java/com/pujan/userservice/controller/UserController.java`
**Role**: The "Receptionist" handling requests.

#### Key Code & Syntax Logic
```java
@RestController // -> Tells Spring "This class handles HTTP requests and returns JSON"
@RequestMapping("/api/users")
public class UserController {

    // 1. @PreAuthorize -> Security Guard. 
    // "isAuthenticated()" ensures only logged-in users can call this.
    // This runs BEFORE the method.
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponseDTO> getCurrentUser() {
        // ... gets user from DB and returns it ...
    }

    // 2. @RequestBody -> Tells Spring: "Take the JSON from the user and turn it into this Java Object (SignupRequest)"
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')") // Only Admins can create users
    public ResponseEntity<?> createUser(@RequestBody SignupRequest signUpRequest) {
        // ...
    }
}
```

---

## 📝 Module 3: The CMS Service
**Location**: `C:/Microservices/cms-service`

### `PermissionService.java`
**Path**: `src/main/java/com/college/cms/security/PermissionService.java`
**Role**: The "Custom Security Check".

#### Key Code & Syntax Logic
```java
@Service("authz") // -> We name this bean "authz" so we can use it in annotations later.
public class PermissionService {

    // This method is called by: @PreAuthorize("@authz.check(#moduleCode, 'CREATE')")
    public boolean check(String moduleCode, String functionName) {
        
        // 1. Get Authentication -> context holds the info passed from Gateway's Headers
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // 2. Super Admin Check -> If they are Super Admin, return true immediately.
        if (requestHasRole(auth, "ROLE_SUPER_ADMIN")) return true;

        // 3. Complex Check -> Loop through the user's authorities (Permissions).
        // Does he have "MODULE:FUNCTION"?
        // e.g., Does he have "GALLERY:CREATE"?
        return auth.getAuthorities().stream().anyMatch(a -> 
            a.getAuthority().equals(moduleCode + ":" + functionName) 
            // OR checks for numeric version (e.g. GALLERY:3)
        );
    }
}
```

---

## 📧 Module 4: The Email Service
**Location**: `C:/Microservices/email-service`

### `EmailSenderService.java`
**Path**: `src/main/java/com/college/emailservice/service/EmailSenderService.java`
**Role**: The "Postman".

#### Key Code & Syntax Logic
```java
@Service
public class EmailSenderService {

    @Autowired
    private JavaMailSender mailSender; // -> Spring Boot's built-in mail tool.

    // 1. @Async -> THE MAGIC.
    // This tells Spring: "Don't wait for this method to finish. Return immediately to the caller, and run this in a background thread."
    // Without this, the User Service would freeze for 5 seconds while waiting for Gmail to respond.
    @Async
    public void sendOtpEmail(String to, String otp, String username) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Your OTP Code");
        message.setText("Hello " + username + ",\n\nYour code is: " + otp);
        
        mailSender.send(message); // -> Network call to SMTP server
    }
}
```

---

## 💻 Module 5: The Frontend (React)
**Location**: `C:/Microservices/adminsuite-ui-main`

### `AuthContext.tsx`
**Path**: `src/contexts/AuthContext.tsx`
**Role**: The "Memory". Remembers who you are.

#### Key Code & Syntax Logic
```tsx
// 1. Context -> A Global Variable accessible by ANY component in the app.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // 2. useEffect -> Runs once when the app triggers.
  useEffect(() => {
    // Check LocalStorage (Browser Memory) for a token.
    const storedToken = localStorage.getItem('token');
    
    if (storedToken) {
        // 3. Auto-Refresh Logic
        // Even if we found a user in memory, let's ask the server for the LATEST version.
        // This fixes the "I changed roles but don't see it" bug.
        usersApi.getMe().then(userData => {
            setUser(userData);
        });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, ... }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### `UserForm.tsx` (Recent Fix)
**Path**: `src/pages/users/UserForm.tsx`
**Role**: The "Edit Profile" page.

#### Key Code & Syntax Logic
```tsx
const mutation = useMutation({
    mutationFn: (data) => usersApi.update(id, data),
    onSuccess: (data) => {
        // 1. Check if updating SELF
        // currentUser is from AuthContext. user.username is the form data.
        if (currentUser?.username === user?.username) {
            
            if (data.token) {
                // If backend sent a new token (username changed), use it.
                login(data.token);
            } else {
                // 2. The Fix: If only Roles changed, backend sends no token.
                // We MUST call refreshProfile() manually to update the UI sidebar.
                refreshProfile();
            }
        }
    }
});
```
