package com.pujan.userservice.service;

import com.pujan.userservice.model.Role;
import com.pujan.userservice.model.Users;
import com.pujan.userservice.repository.UsersRepo;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;

import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.anyString;

@ExtendWith(MockitoExtension.class)
public class CustomUserDetailsServiceTest {

    @Mock
    private UsersRepo usersRepo;

    @Mock
    private RoleService roleService;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    public void testLoadUserByUsername_WithTwoRoles() {
        // Setup User with 2 roles
        Users user = new Users();
        user.setUsername("testuser");
        user.setPassword("password");
        
        Set<Role> roles = new HashSet<>();
        Role role1 = Role.builder().id(1L).name("ROLE_USER").build();
        Role role2 = Role.builder().id(2L).name("ROLE_ADMIN").build();
        roles.add(role1);
        roles.add(role2);
        user.setRoles(roles);

        // Mock Repository
        when(usersRepo.findByUsername("testuser")).thenReturn(Optional.of(user));

        // Mock RoleService
        List<SimpleGrantedAuthority> auths1 = Collections.singletonList(new SimpleGrantedAuthority("READ_USER"));
        List<SimpleGrantedAuthority> auths2 = Collections.singletonList(new SimpleGrantedAuthority("WRITE_USER"));

        when(roleService.getAuthoritiesForRole("ROLE_USER")).thenReturn(auths1);
        when(roleService.getAuthoritiesForRole("ROLE_ADMIN")).thenReturn(auths2);

        // Execute
        UserDetails userDetails = customUserDetailsService.loadUserByUsername("testuser");

        // Assert
        Assertions.assertNotNull(userDetails);
        Assertions.assertEquals("testuser", userDetails.getUsername());
        
        // Count authorities: 2 roles + 2 permissions = 4
        // Or if simple roles are added: "ROLE_USER", "ROLE_ADMIN", "READ_USER", "WRITE_USER"
        // CustomUserDetailsService adds: 
        // 1. Role Names (SimpleGrantedAuthority) -> 2
        // 2. Role authorities -> 2
        // Total = 4
        Assertions.assertEquals(4, userDetails.getAuthorities().size());
        
        System.out.println("Authorities: " + userDetails.getAuthorities());
    }
}
