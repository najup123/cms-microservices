package com.college.cms.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

import javax.crypto.SecretKey;

/**
 * JWT Authentication Filter for CMS Service
 * Extracts and validates JWT tokens from Authorization header
 * Sets Spring SecurityContext with username and roles
 * Enables @PreAuthorize annotations to work properly
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Value("${spring.app.JwtSecret}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String requestUri = request.getRequestURI();
        
        System.out.println("=== JwtAuthFilter Processing ===");
        System.out.println("URI: " + requestUri);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            System.out.println("✓ JWT Token found (first 20 chars): " + token.substring(0, Math.min(20, token.length())) + "...");

            try {
                // Decode the JWT secret from BASE64 (matching userservice implementation)
                SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
                
                Claims claims = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                String username = claims.getSubject();
                List<?> rolesList = claims.get("roles", List.class);

                System.out.println("✓ JWT Parsed Successfully");
                System.out.println("✓ Username: " + username);
                System.out.println("✓ Roles from JWT: " + rolesList);

                if (rolesList != null) {
                    List<SimpleGrantedAuthority> authorities = rolesList.stream()
                            .map(role -> {
                                String roleName = role.toString();
                                // Check if role is an integer (short-code optimization)
                                if (role instanceof Integer) {
                                    int id = (Integer) role;
                                    roleName = getRoleName(id);
                                } else if (roleName.contains(":")) {
                                    // Handle composite roles like "ABOUT_US:1" -> "ABOUT_US:SELECT"
                                    String[] parts = roleName.split(":");
                                    if (parts.length == 2 && parts[1].matches("\\d+")) {
                                        try {
                                            int id = Integer.parseInt(parts[1]);
                                            roleName = parts[0] + ":" + getRoleName(id);
                                        } catch (NumberFormatException e) {
                                            // ignore
                                        }
                                    }
                                }
                                return new SimpleGrantedAuthority(roleName);
                            })
                            .collect(Collectors.toList());

                    System.out.println("✓ Authorities created: " + authorities.size());
                    System.out.println("✓ Full authorities list: " + authorities);

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(username, null, authorities);

                    SecurityContextHolder.getContext().setAuthentication(auth);
                    System.out.println("✅ SecurityContext set successfully for user: " + username);
                } else {
                    System.err.println("⚠ No roles found in JWT token");
                }

            } catch (Exception e) {
                System.err.println("❌ JWT validation failed: " + e.getMessage());
                System.err.println("   Exception type: " + e.getClass().getName());
                logger.error("JWT validation failed: " + e.getMessage());
            }
        } else {
            System.out.println("ℹ No JWT token in request (Authorization header missing or invalid)");
        }

        System.out.println("=== JwtAuthFilter END ===\n");
        filterChain.doFilter(request, response);
    }

    private String getRoleName(int id) {
        return switch (id) {
            case 1 -> "SELECT";
            case 2 -> "UPDATE";
            case 3 -> "CREATE";
            case 4 -> "DELETE";
            default -> String.valueOf(id);
        };
    }
}
