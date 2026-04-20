# 📚 Module Documentation: Gateway Service

**Role**: The "Security Guard" and "Traffic Controller".
**Port**: `8080`

---

## 📂 File Structure & Explanations

### 1. `GatewayApplication.java`
**Location**: `src/main/java/com/college/gateway/GatewayApplication.java`
**Purpose**: Entry point.

```java
@SpringBootApplication
@EnableDiscoveryClient // <--- Allows it to talk to Eureka
public class GatewayApplication { ... }
```

*   **`@EnableDiscoveryClient`**: Tells the Gateway to ask Eureka for service locations instead of hardcoding URLs.

### 2. `AuthenticationFilter.java`
**Location**: `src/main/java/com/college/gateway/filter/AuthenticationFilter.java`
**Purpose**: The custom security logic.

```java
@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {
    
    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
             // Logic to check "Authorization: Bearer <token>"
             // Logic to validate JWT signature
             // Logic to add "X-User-Id" header
             return chain.filter(exchange); // Proceed to next step
        }
    }
}
```

*   **`AbstractGatewayFilterFactory`**: The base class required to plug into Spring Cloud Gateway.
*   **`exchange`**: Represents the current HTTP Context (Request + Response).
*   **`chain.filter`**: Passes the baton to the next runner. If you don't call this, the request stops here.

### 3. `application.yml`
**Location**: `src/main/resources/application.yml`
**Purpose**: Route definitions.

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://USERSERVICE  # <--- lb = Load Balanced (via Eureka)
          predicates:
            - Path=/api/users/** # <--- Traffic matching this goes to Userservice
          filters:
            - AuthenticationFilter # <--- Apply our custom security filter
```

*   **`lb://`**: Critical syntax. Tells Gateway "Look up this name in Eureka".
*   **`predicates`**: Conditions. "If URL matches X, do Y".

---

## ⚙️ How It Works

1.  **Request**: User hits `http://localhost:8080/api/users/me`.
2.  **Match**: Gateway sees `/api/users/**` matches the `user-service` route.
3.  **Filter**: It runs `AuthenticationFilter`.
    *   Validates Token.
    *   Extracts User ID.
4.  **Lookup**: It asks Eureka: "Where is USERSERVICE?".
5.  **Forward**: It forwards the request to `localhost:9092/api/users/me` with the `X-User-Id` header attached.
