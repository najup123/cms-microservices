package com.pujan.userservice.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtUtils {

    @Value("${spring.app.JwtSecret}")
    private String jwtSecret;

    @Value("${spring.app.JwtExpirationMs}")
    private int jwtExpirationMs;

    private Key key;

    @PostConstruct
    public void init() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    public String getJwtFromHeader(HttpServletRequest request){
        String bearerToken = request.getHeader("Authorization");
        if(bearerToken != null && bearerToken.startsWith("Bearer ")){
            return bearerToken.substring(7);
        }
        return null;
    }

    public String generateTokenFromUsername(UserDetails userDetails){
        List<Object> roles = userDetails.getAuthorities().stream()
                .map(authority -> {
                    String roleName = authority.getAuthority();
                    // Handle composite roles like "ABOUT_US:SELECT" -> "ABOUT_US:1"
                    if (roleName.contains(":")) {
                        String[] parts = roleName.split(":");
                        if (parts.length == 2) {
                            int id = com.pujan.userservice.rbac.StaticFunction.getId(parts[1]);
                            if (id != -1) {
                                return parts[0] + ":" + id;
                            }
                        }
                    }
                    // Handle simple roles like "SELECT" -> 1
                    int id = com.pujan.userservice.rbac.StaticFunction.getId(roleName);
                    return id != -1 ? id : roleName;
                })
                .collect(Collectors.toList());

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("roles", roles)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(new Date().getTime() + jwtExpirationMs+60*1000*60*60))
                .signWith(key)
                .compact();
    }

    public String getUsernameFromJwtToken(String token){
        return Jwts.parser()
                .verifyWith((SecretKey) key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromJwtToken(String token){
        List<Object> rawRoles = Jwts.parser()
                .verifyWith((SecretKey) key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("roles", List.class);
        
        if (rawRoles == null) return List.of();

        return rawRoles.stream()
                .map(role -> {
                    if (role instanceof Integer) {
                        return com.pujan.userservice.rbac.StaticFunction.getName((Integer) role);
                    }
                    String strRole = role.toString();
                    // Restore "ABOUT_US:1" -> "ABOUT_US:SELECT"
                    if (strRole.contains(":")) {
                        String[] parts = strRole.split(":");
                        if (parts.length == 2 && parts[1].matches("\\d+")) {
                            try {
                                int id = Integer.parseInt(parts[1]);
                                return parts[0] + ":" + com.pujan.userservice.rbac.StaticFunction.getName(id);
                            } catch (NumberFormatException e) {
                                // ignore
                            }
                        }
                    }
                    return strRole;
                })
                .collect(Collectors.toList());
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser()
                    .verifyWith((SecretKey) key)
                    .build()
                    .parseSignedClaims(authToken);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}