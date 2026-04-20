# 🎓 Microservices Masterclass: The University Architecture

**Objective**: This document is a complete blueprint. It explains not just *what* we built, but *how* to build it again from scratch. It connects the dots between dependencies, code patterns, and architectural decisions.

---

## 🏗️ Phase 1: The Foundation (Infrastructure)

Before writing business logic, we need the "roads" and "address book" for our services.

### 1. Service Registry (Eureka)
**Goal**: Services shouldn't guess IP addresses (which change). They should look up names like `USERSERVICE`.

*   **Setup**:
    *   Dependency: `spring-cloud-starter-netflix-eureka-server`
    *   Annotation: `@EnableEurekaServer` in main class.
*   **The "Trick"**:
    *   By default, Eureka tries to register with *itself*. We disable this in `application.properties`:
        ```properties
        eureka.client.register-with-eureka=false
        eureka.client.fetch-registry=false
        server.port=8761
        ```
*   **Why it matters**: Now, every other service just needs to say `eureka.client.service-url.defaultZone=http://localhost:8761/eureka/` and they are part of the network.

### 2. API Gateway (Spring Cloud Gateway)
**Goal**: ONE entry point (port 8080) for the frontend. No direct access to internal services.

*   **Setup**: `spring-cloud-starter-gateway`, `spring-cloud-starter-netflix-eureka-client`.
*   **The Routing Logic (`application.yml`)**:
    ```yaml
    routes:
      - id: user-service
        uri: lb://USERSERVICE  # lb = Load Balancer (looks up Eureka)
        predicates:
          - Path=/api/users/**, /api/auth/**
    ```
*   **The Security Layer (`JwtAuthFilter.java`)**:
    *   This is a **Global Filter**. It runs *before* routing.
    *   **Responsibility**:
        1. Check `Authorization: Bearer <token>` header.
        2. Validate signature using the shared Secret Key.
        3. **Critical Step**: Extract User ID and Roles, and *mutate* the request adding `X-User-Id` and `X-User-Roles` headers.
    *   **Why**: Internal services (CMS, User) don't need to re-validate the token. They just trust the Gateway's `X-User-Id` header (assuming internal network is private).

---

## 🔐 Phase 2: The Core (User Service)

**Goal**: Identity Management. "Who are you?"

### 1. Data Modeling (The "SuperBuilder" Lesson)
We learned that standard Java inheritance doesn't play nice with Lombok's `@Builder`.
*   **Pattern**: Use `@SuperBuilder` on Parent (`CommonTable`) and Child (`Users`, `Role`) classes.
*   **Why**: This allows `Users.builder().id(1).createdAt(now).build()`. Without it, the builder can't see parent fields.

### 2. JWT Optimization (The "Payload" Lesson)
Original design: Storing full role objects in JWT (`{name: "ADMIN", modules: [...]}`).
**Problem**: The token got too huge, exceeding header limits (4KB+).
**Solution**:
*   **Backend**: Map permissions to Integers (1=SELECT, 2=UPDATE). Map modules to potentially short codes.
*   **Format**: `["ROLE_USER", "GALLERY:2", "ADMISSION:3"]`.
*   **Result**: A tiny, fast token.

### 3. Password Security
*   **Registration**: Frontend sends plain text -> Service hashes with `BCryptPasswordEncoder` -> DB.
*   **Double-Encoding Bug**: We had a bug where updating a user re-hashed the already-hashed password.
*   **Fix**: In `updateUser`, check if the password field is null/empty. Only re-hash if it's a *new* password.

---

## 📝 Phase 3: The Brain (CMS Service)

**Goal**: Dynamic Content. "Create new modules without restarting."

### 1. The Generic Controller Pattern
Instead of writing `StudentController`, `TeacherController`, `EventController`... we wrote **ONE** `CmsController`.
*   **Endpoint**: `POST /api/content/{moduleCode}`
*   **How it works**:
    1.  Receives `moduleCode` (e.g., "ALUMNI").
    2.  Checks Schema (Does "ALUMNI" exist?).
    3.  Checks Permissions (`@PreAuthorize("@authz.check(#moduleCode, 'CREATE')")`).
    4.  Saves data as a JSON blob (`Map<String, Object>`).

### 2. Authorization Service (`PermissionService.java`)
This bean bridges the gap between Spring Security and our Custom Logic.
*   It grabs permissions from the `SecurityContext` (which Gateway populated).
*   It answers: "Does User X have 'CREATE' rights on 'ALUMNI'?" by checking the `MODULE:FUNCTION_ID` strings we packed in the JWT.

---

## 📧 Phase 4: The Worker (Email Service)

**Goal**: Reliability & Speed.

### 1. Asynchronous Processing
*   **Problem**: Sending an email takes 2-4 seconds. Blocking the "Register" request meant the UI froze.
*   **Solution**: `@EnableAsync` in Main class, `@Async` on `sendEmail` method.
*   **Result**: The request returns "Success" instantly. The email sends in a background thread.

### 2. OTP Security
*   **Pattern**: `Request -> Verify -> Token`.
*   We implemented a **3-Attempt Limit** to prevent brute-forcing.
*   We implemented a **Time Limit** (5 minutes).

---

## 💻 Phase 5: The Interface (Frontend)

**Goal**: Reacting to the Backend.

### 1. Dynamic Routing (`Navbar.tsx`)
We don't hardcode links.
*   **Logic**:
    ```javascript
    const userModules = extractModulesFromToken(user);
    return userModules.map(mod => <Link to={`/cms/${mod.code}`}>{mod.name}</Link>);
    ```
*   **Power**: If you create a "Cafeteria Menu" module in the backend and assign it to a user, the link **magically appears** on their next reload. No frontend code changes needed!

### 2. Smart Forms (`DynamicCmsForm.tsx`)
This component reads the **Schema** (from CMS Service) and builds the form on the fly.
*   If Schema says `type: "date"`, it renders a Calendar.
*   If Schema says `type: "rich-text"`, it renders a WYSIWYG editor.
*   **Value**: Endless flexibility.

---

## 🛠️ How to Build This Yourself (Step-by-Step)

1.  **Start Small**:
    *   Create **Service Registry** (get 8761 running).
    *   Create **Gateway** (get 8080 routing to google.com as a test).

2.  **Build Identity**:
    *   Create **User Service**. Connect to Postgres.
    *   Implement `/login` and `/register`.
    *   Get a JWT issuing successfully.

3.  **Connect Gateway**:
    *   Write the `JwtAuthFilter` in Gateway to validate that JWT.
    *   Route `/api/users` through Gateway.

4.  **Add Functionality**:
    *   Create **CMS Service**.
    *   Implement the "Generic Controller".
    *   Connect it to Gateway.

5.  **Build Frontend**:
    *   Setup React + Vite + Tailwind.
    *   Create `AuthContext` to store that JWT.
    *   Build the Login page.
    *   Build the Dynamic Dashboard.

6.  **Polish**:
    *   Add **Email Service** for OTPs.
    *   Refine permissions.
    *   Optimize (Async, Caching).

You now have the blueprint. This architecture scales from 1 user to 1 million users because every piece is independent. Good luck!
