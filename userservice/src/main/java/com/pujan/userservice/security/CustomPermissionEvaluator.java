package com.pujan.userservice.security;

import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.io.Serializable;

@Component
public class CustomPermissionEvaluator implements PermissionEvaluator {

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {

        String moduleKey = normalizeKey(targetDomainObject.toString());
        String functionKey = permission.toString().trim().toUpperCase();

        String requiredAuthority = moduleKey + ":" + functionKey;

        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if (requiredAuthority.equals(authority.getAuthority())) {
                return true;
            }
        }

        return false;
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        // Not used in this application
        return false;
    }

    private String normalizeKey(String raw) {
        if (raw == null) return "";
        return raw.trim().replaceAll("\\s+", "_").toUpperCase();
    }
}
