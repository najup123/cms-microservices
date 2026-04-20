package com.college.cms.controller;

import com.college.cms.model.*;
import com.college.cms.repository.*;
import com.college.cms.service.SchemaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;


@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class CmsController {

    private final CmsSchemaRepo schemaRepo;
    private final CmsContentRepo contentRepo;
    private final SchemaService schemaService;

    // 1. ADMIN DEFINES SCHEMA (Functionality Definition)
    // Only Super Admin can define what "ADMISSION" module actually looks like.
    @PostMapping("/admin/schema")
    @PreAuthorize("hasRole('ROLE_SUPER_ADMIN')")
    public ResponseEntity<?> createSchema(@RequestBody CmsSchema schema) {
        // e.g., Schema for "ADMISSION" with fields [StudentName, Grade, etc.]
        return ResponseEntity.ok(schemaRepo.save(schema));
    }

    // Endpoint for userservice to auto-create schema when module is created
    @PostMapping("/schema/auto-create")
    public ResponseEntity<?> autoCreateSchema(@RequestBody Map<String, String> payload) {
        String moduleCode = payload.get("moduleCode");
        String displayName = payload.get("displayName");

        if (moduleCode == null || moduleCode.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Module code is required");
        }

        try {
            CmsSchema schema = schemaService.createDefaultSchema(moduleCode, displayName);
            return ResponseEntity.ok(schema);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to create schema: " + e.getMessage());
        }
    }

    @GetMapping("/schema/{moduleCode}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getSchema(@PathVariable String moduleCode) {
        String normalizedModuleCode = moduleCode.replace(" ", "_").toUpperCase();
        return schemaRepo.findByModuleCode(normalizedModuleCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 2. GENERIC CREATE (For any module created in User Service)
    // Permission check relies on @authz.check and the moduleCode passed in URL
    @PostMapping("/content/{moduleCode}")
    @PreAuthorize("@authz.check(#moduleCode.replace(' ', '_'), 'CREATE')")
    @Transactional
    public ResponseEntity<?> createContent(
            @PathVariable String moduleCode,
            @RequestBody Map<String, Object> data,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId,
            jakarta.servlet.http.HttpServletRequest request) {

        String normalizedModuleCode = moduleCode.replace(" ", "_").toUpperCase();

        // 1. Check if Schema exists for this module (Optional validation)
        schemaRepo.findByModuleCode(normalizedModuleCode)
                .orElseThrow(() -> new RuntimeException("Schema not defined for " + normalizedModuleCode));

        // 2. Save Content
        
        // Extract Entry Name (Try common fields)
        String entryName = "Untitled";
        if (data.containsKey("title")) entryName = String.valueOf(data.get("title"));
        else if (data.containsKey("name")) entryName = String.valueOf(data.get("name"));
        else if (data.containsKey("fullName")) entryName = String.valueOf(data.get("fullName"));
        else if (data.containsKey("subject")) entryName = String.valueOf(data.get("subject"));
        
        CmsContent content = CmsContent.builder()
                .moduleCode(normalizedModuleCode)
                .data(data)
                .isPublished(true)
                // CommonTable Fields
                .moduleName(normalizedModuleCode)
                .entryType("CMS_CONTENT")
                .entryName(entryName)
                .fromUrl(request.getHeader("Referer"))
                .build();
        CmsContent saved = contentRepo.save(content);

        return ResponseEntity.ok(saved);
    }

    // 3. GENERIC GET ALL
    @GetMapping("/content/{moduleCode}")
    @PreAuthorize("@authz.check(#moduleCode.replace(' ', '_'), 'SELECT')")
    public ResponseEntity<?> getContent(@PathVariable String moduleCode) {
        String normalizedModuleCode = moduleCode.replace(" ", "_").toUpperCase();
        return ResponseEntity.ok(contentRepo.findByModuleCode(normalizedModuleCode));
    }

    // 4. GET SINGLE CONTENT BY ID
    @GetMapping("/content/{moduleCode}/{id}")
    @PreAuthorize("@authz.check(#moduleCode.replace(' ', '_'), 'SELECT')")
    public ResponseEntity<?> getContentById(
            @PathVariable String moduleCode,
            @PathVariable Long id) {
        String normalizedModuleCode = moduleCode.replace(" ", "_").toUpperCase();
        return contentRepo.findById(id)
                .filter(content -> content.getModuleCode().equalsIgnoreCase(normalizedModuleCode))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 5. GENERIC UPDATE
    @PutMapping("/content/{moduleCode}/{id}")
    @PreAuthorize("@authz.check(#moduleCode.replace(' ', '_'), 'UPDATE')")
    @Transactional
    public ResponseEntity<?> updateContent(
            @PathVariable String moduleCode,
            @PathVariable Long id,
            @RequestBody Map<String, Object> data,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId) {

        String normalizedModuleCode = moduleCode.replace(" ", "_").toUpperCase();

        return contentRepo.findById(id)
                .filter(content -> content.getModuleCode().equalsIgnoreCase(normalizedModuleCode))
                .map(content -> {
                    content.setData(data);
                    
                    // Update entryName if data contains title/name fields
                    if (data.containsKey("title")) content.setEntryName(String.valueOf(data.get("title")));
                    else if (data.containsKey("name")) content.setEntryName(String.valueOf(data.get("name")));
                    else if (data.containsKey("fullName")) content.setEntryName(String.valueOf(data.get("fullName")));
                    else if (data.containsKey("subject")) content.setEntryName(String.valueOf(data.get("subject")));
                    
                    CmsContent updated = contentRepo.save(content);

                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 6. GENERIC DELETE
    @DeleteMapping("/content/{moduleCode}/{id}")
    @PreAuthorize("@authz.check(#moduleCode.replace(' ', '_'), 'DELETE')")
    @Transactional
    public ResponseEntity<?> deleteContent(
            @PathVariable String moduleCode,
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", defaultValue = "anonymous") String userId) {

        String normalizedModuleCode = moduleCode.replace(" ", "_").toUpperCase();

        return contentRepo.findById(id)
                .filter(content -> content.getModuleCode().equalsIgnoreCase(normalizedModuleCode))
                .map(content -> {
                    contentRepo.delete(content);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
