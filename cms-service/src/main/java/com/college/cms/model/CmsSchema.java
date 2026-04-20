package com.college.cms.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

// DEFINITION: Stores what fields "ADMISSION" has
@Entity
@Table(name = "cms_schema")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class CmsSchema extends CommonTable{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String moduleCode; // Matches User Service Code

    private String displayName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Map<String, Object>> fields; // [{"name":"student_name", "type":"text"}]

    @Override
    protected String provideEntryName() {
        return this.displayName != null ? this.displayName : this.moduleCode;
    }

    @Override
    protected String provideEntryType() {
        return "CMS_SCHEMA";
    }

    @Override
    protected String provideModuleName() {
        return this.moduleCode;
    }
}