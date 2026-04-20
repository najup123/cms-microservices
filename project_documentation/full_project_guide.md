# University of JanDai - Microservices Architecture Guide

This documentation explains how the **University of JanDai** application works under the hood. It is designed for someone with basic technical knowledge who wants to understand the "magic" behind the microservices, security, and dynamic content management.

---

## 🏗️ 1. High-Level Architecture

Imagine a large university campus.
*   **Service Registry (Eureka)** is the **Reception Desk**: It knows where every department (Service) is located.
*   **API Gateway** is the **Main Entrance/Security Check**: Everyone must go through here. It checks ID cards (JWT Tokens) and directs you to the right building.
*   **User Service** is the **Administration Building**: Handles student/staff records, ID cards, and permissions.
*   **CMS Service** is the **Library/Notice Board**: Stores and manages content (articles, pages).
*   **Email Service** is the **Mail Room**: Sends notifications and OTPs.
*   **Frontend (React)** is the **Campus Map/Guidebook**: The interface you hold in your hand to interact with everything.

---

## 🔐 2. The Gatekeeper: API Gateway Service

**Role**: Security & Routing.
**Key File**: `AuthenticationFilter.java`

Every request from the Frontend hits the Gateway first. It performs a critical security check before the request ever reaches the destination service.

### How Logic Works
1.  **Intercept**: The Gateway "intercepts" the request.
2.  **Validate**: It looks for the `Authorization` header (Bearer Token).
3.  **Verify**: It uses the shared `JwtUtil` logic to check if the token is valid (signed by us, not expired).
4.  **Enrich**: If valid, it extracts the `User ID` and `Roles` and stamps them onto the request headers (`X-User-Id`, `X-User-Roles`). This is like security stamping your hand so services inside don't need to check your ID again.

```java
// Logic inside AuthenticationFilter.apply()
if (validator.isSecured.test(request)) {
    // 1. Check for Token
    if (!exchange.getRequest().getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
        throw new RuntimeException("Missing authorization header");
    }

    // 2. Validate Token using JwtUtils
    String authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION).get(0);
    String token = authHeader.substring(7); // Remove "Bearer "
    jwtUtil.validateToken(token);

    // 3. Forward Request with "Stamps"
    request.mutate()
        .header("X-User-Id", userId) // Pass ID to internal service
        .build();
}
```

---

## 👤 3. The Identity Provider: User Service

**Role**: Managing Users, Roles, and Permissions (RBAC).
**Key Concept**: Role-Based Access Control (RBAC).

This service is the source of truth for "Who are you?" and "What can you do?".

### The Data Model
*   **Users**: The person (e.g., "John Doe").
*   **Roles**: A hat they wear (e.g., "Dean", "Student", "Editor").
    *   *Code file*: `Role.java`
*   **Modules**: A specific area they can access (e.g., "ADMISSION", "GALLERY").
    *   *Code file*: `Module.java`
*   **Permissions (Functions)**: Specific actions they can take (Create, Read, Update, Delete).
    *   *Code file*: `StaticFunction.java`

### The JWT Token (The ID Card)
When you log in, the User Service creates a **JWT (JSON Web Token)**. It packs all your permissions into this digital card.

**Optimization Trick**: Instead of writing "CAN_EDIT_ADMISSION_MODULE", we store it efficiently (e.g., `ADMISSION:2`).
*   `1` = SELECT (View)
*   `2` = UPDATE (Edit)
*   `3` = CREATE (Add)
*   `4` = DELETE (Remove)

```java
// StaticFunction.java
public static final int SELECT = 1;
public static final int UPDATE = 2;
public static final int CREATE = 3;
public static final int DELETE = 4;
```

When generating the token:
```java
// JwtUtils.java
// We map complex permissions into a compact list of strings for the token
List<String> permissions = user.getRoles().stream()
    .flatMap(role -> role.getModules().stream())
    .map(module -> module.getCode() + ":" + module.getFunctionId()) // e.g., "GALLERY:3"
    .collect(Collectors.toList());
```

---

## 📝 4. The Content Manager: CMS Service

**Role**: Storing dynamic content.
**Key Feature**: Dynamic Schemas.

Unlike traditional apps where "Student" and "Teacher" tables are hardcoded, the CMS Service is **Dynamic**. You can create a new module (e.g., "Alumni Events") *without writing code*.

### How it Works
1.  **Schema**: Defines the "Shape" of data (e.g., Title, Date, Image).
2.  **Content**: The actual data stored as JSON.

### Security (Authorization)
The CMS Service trusts the Gateway. It looks at the `X-User-Id` header (passed by Gateway) and the **Authorities** (Permissions) in the Security Context.

```java
// CmsController.java
// This line checks: Does the user have 'CREATE' permission for 'ADMISSION'?
@PreAuthorize("@authz.check(#moduleCode, 'CREATE')")
public ResponseEntity<?> createContent(...) {
    // ...
}
```

The `@authz` bean (`PermissionService.java`) checks the user's roles against the requested action.

---

## 📧 5. The Notifier: Email Service

**Role**: Sending Async Notifications.
**Key Concept**: Asynchronous Processing (`@Async`).

Sending an email can take 2-5 seconds. We don't want the user to wait at the "Register" button for 5 seconds.

### The Async Solution
We verify the request and tell the user "OK", then send the email in the background.

```java
// EmailSenderService.java
@Async // <-- This tells Spring: "Run this in a separate thread"
public void sendOtpEmail(String to, String otp, ...) {
    // Heavy lifting of connecting to SMTP server and sending mail
    mailSender.send(message);
}
```

### OTP Flow
1.  **Generate**: Random 6-digit code.
2.  **Save**: Store in DB with an expiry time (`OtpVerification.java`).
3.  **Send**: Trigger Async email.
4.  **Verify**: User enters code -> Match with DB -> Check if expired.

---

## 💻 6. The User Interface: Frontend (React)

**Role**: The conductor of the orchestra.
**Key File**: `AuthContext.tsx`, `api.ts`

The frontend connects all these services into a smooth experience.

### AuthContext (The Brain)
*   It holds the **User State** (Who is logged in?).
*   It provides helper functions like `hasRole('ADMIN')` or `hasModulePermission('GALLERY', 2)`.
*   **Auto-Refresh**: When the app loads, it calls `/api/users/me` to get the freshest data, so if you changed roles in the backend, the frontend knows immediately.

### Dynamic Routing
The `Navbar.tsx` doesn't have hardcoded links like `<a href="/gallery">`. Instead, it loops through your permissions:

```tsx
// Navbar.tsx
{userModules.map(module => (
   <NavLink to={`/cms/${module.code}`}>
      {module.name}
   </NavLink>
))}
```
This means if you give a user access to the "Research" module, the link appears automatically. If you revoke it, the link vanishes.

---

## 🔄 7. putting it all together: The Registration Flow

1.  **User**: Fills form on React Frontend.
2.  **Frontend**: Calls `POST /api/users/register`.
3.  **Gateway**: Sees `/register` is whitelisted (public). Forwards to **User Service**.
4.  **User Service**:
    *   Validates input.
    *   Creates `Users` entity in Postgres DB.
    *   Calls **Email Service** to send OTP.
5.  **Email Service**:
    *   Generates OTP.
    *   Sends email (Async).
6.  **User**: Receives email, enters OTP.
7.  **User Service**: Verifies OTP. Activates account.
8.  **User**: Logs in.
    *   **User Service** generates JWT with roles `[USER, GALLERY:READ]`.
9.  **Frontend**: Receives JWT, stores in LocalStorage.
10. **Frontend**: Updates UI, showing "Gallery" link because `GALLERY:READ` is present.
