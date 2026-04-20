package com.pujan.userservice;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pujan.userservice.controller.UserController;
import com.pujan.userservice.dto.SignupRequest;
import com.pujan.userservice.repository.RoleRepo;
import com.pujan.userservice.repository.UsersRepo;
import com.pujan.userservice.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashSet;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
public class UserControllerPermissionTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private UsersRepo usersRepo;

    @MockBean
    private RoleRepo roleRepo;
    
    // Check if PasswordEncoder is needed by UserController. Yes it is autowired.
    @MockBean
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testAdminCannotCreateSuperAdmin() throws Exception {
        SignupRequest request = new SignupRequest();
        request.setUsername("newsuper");
        request.setEmail("super@test.com");
        request.setPassword("password");
        Set<String> roles = new HashSet<>();
        roles.add("SUPER_ADMIN");
        request.setRoles(roles);

        // Mock userService: isCurrentUserSuperAdmin -> false
        when(userService.isCurrentUserSuperAdmin()).thenReturn(false);
        when(usersRepo.existsByUsername(any())).thenReturn(false);

        mockMvc.perform(post("/api/users")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    public void testAdminCannotDeleteUser() throws Exception {
        mockMvc.perform(delete("/api/users/123")
                .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "super", roles = {"SUPER_ADMIN"})
    public void testSuperAdminCanCreateSuperAdmin() throws Exception {
        // Even though we mock the role check in the controller using userService.isCurrentUserSuperAdmin(),
        // we also need to pass the @PreAuthorize check which uses the token roles.
        // @WithMockUser handles the PreAuthorize.
        // Our controller logic handles the specific business rule.

        SignupRequest request = new SignupRequest();
        request.setUsername("newsuper2");
        request.setEmail("super2@test.com");
        request.setPassword("password");
        Set<String> roles = new HashSet<>();
        roles.add("SUPER_ADMIN");
        request.setRoles(roles);

        // Mock userService to say current user IS super admin
        when(userService.isCurrentUserSuperAdmin()).thenReturn(true);
        when(usersRepo.existsByUsername(any())).thenReturn(false);
        when(roleRepo.findByName(any())).thenReturn(java.util.Optional.of(new com.pujan.userservice.model.Role()));
        when(userService.createUser(any())).thenReturn(new com.pujan.userservice.model.Users());

        mockMvc.perform(post("/api/users")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}
