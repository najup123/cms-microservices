package com.college.cms.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;


// AUDIT: Shared Metadata
@MappedSuperclass
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public abstract class CommonTable {
    
    // Subclasses will have their own @Id, so we remove entryId
    
    private String entryName;
    private String entryType;
    private Long entryId;
    private String moduleName;
    private String lastAction;
    private String createdByUsername;
    private LocalDateTime entryDateTime;
    private String fromUrl;
    
    protected abstract String provideEntryName();
    protected abstract String provideEntryType();
    protected abstract String provideModuleName();

    @PrePersist
    public void onPrePersist() {
        this.entryDateTime = LocalDateTime.now();
        this.lastAction = "CREATE";
        this.createdByUsername = getCurrentUsername();
        
        // Explicitly use subclass provided values
        this.entryType = provideEntryType();
        this.moduleName = provideModuleName();
        this.entryName = provideEntryName();
        
        if (this.fromUrl == null || this.fromUrl.isEmpty()) {
            this.fromUrl = deriveFromUrl();
        }
    }
    
    @PreUpdate
    public void onPreUpdate() {
        this.entryDateTime = LocalDateTime.now();
        this.lastAction = "UPDATE";
        this.createdByUsername = getCurrentUsername();
        
        // Update entryName as it might have changed
        this.entryName = provideEntryName();
        
        // Ensure constants are enforced
        if (this.entryType == null) this.entryType = provideEntryType();
        if (this.moduleName == null) this.moduleName = provideModuleName();
    }
    
    @PreRemove
    public void onPreRemove() {
        this.lastAction = "DELETE";
    }
    
    private String getCurrentUsername() {
         // CMS Service might be behind a Gateway that passes User ID or Role, 
         // but authenticating context lookup might fail if not fully secured in the same way.
         // We'll try harmlessly.
        try {
            if (org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication() != null) {
                return org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
            }
        } catch (Exception e) {
            // Ignore
        }
        return "SYSTEM";
    }
    
    private String deriveFromUrl() {
        // Try to get the URL from the current HTTP request
        try {
            org.springframework.web.context.request.RequestAttributes requestAttributes = 
                org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            
            if (requestAttributes instanceof org.springframework.web.context.request.ServletRequestAttributes) {
                jakarta.servlet.http.HttpServletRequest request = 
                    ((org.springframework.web.context.request.ServletRequestAttributes) requestAttributes).getRequest();
                
                String referer = request.getHeader("Referer");
                if (referer != null && !referer.isEmpty()) {
                    return referer;
                }
                
                // Fallback to request URI
                return request.getRequestURI();
            }
        } catch (Exception e) {
            // Ignore if request context not available
        }
        
        return "SYSTEM";
    }
}
