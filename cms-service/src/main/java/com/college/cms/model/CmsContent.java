package com.college.cms.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

@Entity
@Table(name = "cms_content")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class CmsContent extends CommonTable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String moduleCode; // "ADMISSION"

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> data; // {"student_name":"John", "grade":"A"}

    private boolean isPublished;

    @Override
    protected String provideEntryName() {
        // Try to extract meaningful name from data map
        if (data != null) {
            if (data.containsKey("title")) return String.valueOf(data.get("title"));
            if (data.containsKey("name")) return String.valueOf(data.get("name"));
            if (data.containsKey("fullName")) return String.valueOf(data.get("fullName"));
            if (data.containsKey("subject")) return String.valueOf(data.get("subject"));
        }
        return "Untitled Content";
    }

    @Override
    protected String provideEntryType() {
        return "CMS_CONTENT";
    }

    @Override
    protected String provideModuleName() {
        return this.moduleCode;
    }
}