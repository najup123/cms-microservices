# 📚 Module Documentation: Service Registry (Eureka)

**Role**: The "Phone Book" of the Microservices Network.
**Port**: `8761`

---

## 📂 File Structure & Explanations

### 1. `ServiceRegistryApplication.java`
**Location**: `src/main/java/com/college/serviceregistry/ServiceRegistryApplication.java`
**Purpose**: The entry point.

```java
@SpringBootApplication
@EnableEurekaServer // <--- CRITICAL SYNTAX
public class ServiceRegistryApplication {
    public static void main(String[] args) {
        SpringApplication.run(ServiceRegistryApplication.class, args);
    }
}
```

*   **`@EnableEurekaServer`**: This simple annotation transforms a standard Spring Boot app into a Netflix Eureka Server. It activates the dashboard UI and the registration API endpoints.

### 2. `application.properties`
**Location**: `src/main/resources/application.properties`
**Purpose**: Configuration.

```properties
server.port=8761
eureka.client.register-with-eureka=false
eureka.client.fetch-registry=false
```

*   **`server.port=8761`**: The standard port for Eureka.
*   **`register-with-eureka=false`**: A server shouldn't register with itself. It *is* the registry.
*   **`fetch-registry=false`**: It doesn't need to pull the list of services; it *owns* the list.

---

## ⚙️ How It Works

1.  **Startup**: When this app starts, it clears its internal map of services.
2.  **Heartbeats**: every connected service (User, CMS, etc.) sends a "Heartbeat" (Pulse) every 30 seconds to `http://localhost:8761/eureka/`.
3.  **Eviction**: If Eureka doesn't hear from a service for 90 seconds, it removes it from the list (assumes it crashed).
4.  **Discovery**: Other services (like Gateway) ask Eureka: "Where is USERSERVICE?". Eureka responds with the IP and Port (e.g., `192.168.1.5:9092`).
