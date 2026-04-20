# 📚 Module Documentation: CMS Service

**Role**: Dynamic Content Management.
**Port**: Random (Assigned by OS), Registered as `CMS-SERVICE`.

---

## 📂 File Structure & Explanations

### 1. `CmsController.java`
**Location**: `src/main/java/com/college/cms/controller/CmsController.java`
**Purpose**: Handling generic content requests.

```java
@RestController
@RequestMapping("/api/content")
public class CmsController {

    @PostMapping("/{moduleCode}")
    @PreAuthorize("@authz.check(#moduleCode, 'CREATE')") // <--- DYNAMIC SECURITY
    public ResponseEntity<?> createContent(
            @PathVariable String moduleCode, 
            @RequestBody Map<String, Object> data) {
        // ... Saves data to MongoDB/Postgres ...
    }
}
```

*   **`@PathVariable`**: Captures `ADMISSION` from `/api/content/ADMISSION`.
*   **`@RequestBody Map<String, Object>`**: Captures *any* JSON structure. We don't define specific fields because schema is dynamic.
*   **`@PreAuthorize("@authz...")`**: Calls our custom security bean.

### 2. `PermissionService.java`
**Location**: `src/main/java/com/college/cms/security/PermissionService.java`
**Purpose**: Fine-grained authorization.

```java
@Service("authz") // Named "authz" for use in SpEL (Spring Expression Language)
public class PermissionService {
    
    public boolean check(String module, String action) {
        // 1. Get Authentication from Context
        // 2. Check if user's roles list contains "MODULE:ACTION"
        // 3. Return true/false
    }
}
```

### 3. `CmsContent.java` & `CmsSchema.java`
**Location**: `src/main/java/com/college/cms/model/...`
**Purpose**: Database Entities.

*   **`CmsSchema`**: Defines the "Blueprint" (e.g., "News has a Title and Date").
*   **`CmsContent`**: Stores the "Data" (e.g., "The School won a prize", "2023-12-01").
    *   Uses `@Convert` (JPA mechanism) to store the flexible JSON data as a String in SQL, while acting like a Map in Java.

---

## ⚙️ How It Works (The "Generic" Magic)

1.  **No Boilerplate**: Most apps need `StudentController`, `TeacherController`, etc.
2.  **One Controller to Rule Them All**: `CmsController` handles *everything*.
3.  **Differentiation**: It uses the `moduleCode` in the URL to know what to do.
4.  **Safety**: It uses the `CmsSchema` table to validate data before saving. "You sent a string, but the 'Admission' schema says this field must be a Number."

---

## 🔑 Important Syntaxes

*   **`@Type(type = "json")`** (if using Hibernate types): Used to store JSON in SQL.
*   **`SecurityContextHolder.getContext().getAuthentication()`**: The global "shelf" where we retrieve the current user's ID card after the Gateway checks it.
