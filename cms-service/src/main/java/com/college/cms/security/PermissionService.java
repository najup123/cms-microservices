package com.college.cms.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Permission Service for CMS
 * Checks permissions using authorities from JWT token (loaded by JwtAuthFilter)
 * JWT token contains module permissions in format: "MODULE_CODE:ACTION" (e.g., "ABOUT_US:CREATE")
 * Used by @PreAuthorize("@authz.check('ADMISSION', 'CREATE')")
 */
@Service("authz")
public class PermissionService {

    /**
     * Check if current user has permission to perform action on module
     * Uses authorities from JWT token (already loaded in SecurityContext by JwtAuthFilter)
     * JWT contains authorities in format: "MODULE_CODE:ACTION" (e.g., "ABOUT_US:CREATE")
     * 
     * @param moduleCode Module code (e.g., "ADMISSION", "ABOUT US")
     * @param action Action name (e.g., "CREATE", "SELECT", "UPDATE", "DELETE")
     * @return true if user has permission, false otherwise
     */
    public boolean check(String moduleCode, String action) {
        try {
            // Get current user from SecurityContext (set by JwtAuthFilter)
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            System.out.println("=== PermissionService.check START ===");
            System.out.println("Module: " + moduleCode + " | Action: " + action);
            
            if (auth == null) {
                System.err.println("❌ PermissionService: Authentication is NULL - SecurityContext not set!");
                return false;
            }
            if (!auth.isAuthenticated()) {
                System.err.println("❌ PermissionService: User is NOT authenticated");
                return false;
            }

            String username = auth.getName();
            System.out.println("✓ User: " + username);
            System.out.println("✓ Authenticated: true");
            System.out.println("✓ Authorities count: " + auth.getAuthorities().size());
            System.out.println("✓ All Authorities: " + auth.getAuthorities());

            // GLOBAL ADMIN BYPASS: Admins have access to everything
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> {
                        String role = a.getAuthority().toUpperCase();
                        boolean matches = role.contains("ADMIN") || role.contains("SUPER");
                        if (matches) {
                            System.out.println("✓ Admin authority found: " + role);
                        }
                        return matches;
                    });
            
            if (isAdmin) {
                System.out.println("✅ ACCESS GRANTED: Admin/Super Admin Bypass");
                System.out.println("=== PermissionService.check END (Admin) ===\n");
                return true;
            }

            // Normalize module code to ensure consistency (e.g. "ABOUT US" -> "ABOUT_US")
            String normalizedModuleCode = moduleCode.replace(" ", "_").toUpperCase();
            System.out.println("✓ Original Module Code: '" + moduleCode + "'");
            System.out.println("✓ Normalized Module Code: '" + normalizedModuleCode + "'");
            System.out.println("✓ Action: '" + action + "'");

            // Check if user has the required permission in their JWT authorities
            // JWT contains authorities like "ABOUT_US:CREATE", "ABOUT_US:SELECT", etc.
            String requiredPermission = normalizedModuleCode + ":" + action.toUpperCase();
            System.out.println("✓ Required permission: '" + requiredPermission + "'");

            boolean hasPermission = auth.getAuthorities().stream()
                    .anyMatch(authority -> {
                        String authStr = authority.getAuthority();
                        boolean matches = authStr.equalsIgnoreCase(requiredPermission);
                        if (matches) {
                            System.out.println("✓ Matching authority found: " + authStr);
                        }
                        return matches;
                    });
            
            if (hasPermission) {
                System.out.println("✅ ACCESS GRANTED: Permission found in JWT token");
            } else {
                System.err.println("❌ ACCESS DENIED: Required permission not found in JWT token");
                System.err.println("   User: " + username);
                System.err.println("   Module: " + normalizedModuleCode);
                System.err.println("   Action: " + action);
                System.err.println("   Required: " + requiredPermission);
                System.err.println("   User authorities: " + auth.getAuthorities());
            }
            System.out.println("=== PermissionService.check END ===\n");
            
            return hasPermission;
            
        } catch (Exception e) {
            System.err.println("❌ ERROR in PermissionService.check: " + e.getMessage());
            System.err.println("   Exception type: " + e.getClass().getName());
            System.err.println("   Module: " + moduleCode + " | Action: " + action);
            e.printStackTrace();
            System.out.println("=== PermissionService.check END (Error) ===\n");
            return false;
        }
    }
}
