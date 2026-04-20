package com.college.cms.service;

import com.college.cms.model.CmsSchema;
import com.college.cms.repository.CmsSchemaRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class SchemaService {

    private final CmsSchemaRepo schemaRepo;

    /**
     * Creates a default universal schema for a module
     * @param moduleCode The module code (e.g., "ADMISSION", "GALLERY")
     * @param displayName The display name of the module
     * @return The created schema
     */
    @Transactional
    public CmsSchema createDefaultSchema(String moduleCode, String displayName) {
        // Normalize module code
        String normalizedCode = moduleCode.replace(" ", "_").toUpperCase();

        // Check if schema already exists (idempotent)
        Optional<CmsSchema> existing = schemaRepo.findByModuleCode(normalizedCode);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Create universal schema template
        List<Map<String, Object>> fields = getUniversalSchemaTemplate();

        CmsSchema schema = CmsSchema.builder()
                .moduleCode(normalizedCode)
                .displayName(displayName)
                .fields(fields)
                .build();

        return schemaRepo.save(schema);
    }

    /**
     * Returns the universal schema template with standard fields
     * @return List of field definitions
     */
    public List<Map<String, Object>> getUniversalSchemaTemplate() {
        List<Map<String, Object>> fields = new ArrayList<>();

        // Title field (required)
        Map<String, Object> titleField = new HashMap<>();
        titleField.put("name", "title");
        titleField.put("label", "Title");
        titleField.put("type", "text");
        titleField.put("required", true);
        fields.add(titleField);

        // Description field (optional)
        Map<String, Object> descField = new HashMap<>();
        descField.put("name", "description");
        descField.put("label", "Description");
        descField.put("type", "textarea");
        descField.put("required", false);
        fields.add(descField);

        // Image field (optional)
        Map<String, Object> imageField = new HashMap<>();
        imageField.put("name", "image");
        imageField.put("label", "Image URL");
        imageField.put("type", "text");
        imageField.put("required", false);
        fields.add(imageField);

        // Content field (optional)
        Map<String, Object> contentField = new HashMap<>();
        contentField.put("name", "content");
        contentField.put("label", "Content");
        contentField.put("type", "richtext");
        contentField.put("required", false);
        fields.add(contentField);

        // Active toggle (optional)
        Map<String, Object> activeField = new HashMap<>();
        activeField.put("name", "isActive");
        activeField.put("label", "Active");
        activeField.put("type", "toggle");
        activeField.put("required", false);
        fields.add(activeField);

        return fields;
    }

    /**
     * Check if schema exists for a module
     * @param moduleCode The module code
     * @return true if schema exists, false otherwise
     */
    public boolean schemaExists(String moduleCode) {
        String normalizedCode = moduleCode.replace(" ", "_").toUpperCase();
        return schemaRepo.findByModuleCode(normalizedCode).isPresent();
    }
}
