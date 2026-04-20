package com.pujan.userservice.model;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;


// AUDIT: Shared Metadata
@MappedSuperclass
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public abstract class CommonTable {
    
    // Subclasses will have their own @Id
    
    @Column(name = "entry_name")
    private String entryName;
    
    @Column(name = "entry_type")
    private String entryType;
    
    @Column(name = "module_name")
    private String moduleName;
    
    @Column(name = "last_action")
    private String lastAction;
    
    @Column(name = "created_by_username")
    private String createdByUsername;
    
    @Column(name = "entry_date_time")
    private LocalDateTime entryDateTime;
    
    @Column(name = "from_url")
    private String fromUrl;
    
    /**
     * Abstract methods to force subclasses to provide audit metadata.
     * This avoids fragile reflection logic and ensures data integrity.
     */
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
        
        // Update entryName as it might have changed (e.g. username change)
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
        try {
            if (org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication() != null) {
                return org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
            }
        } catch (Exception e) {
            // Ignore if security context not available
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
