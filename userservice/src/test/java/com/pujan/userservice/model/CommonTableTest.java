package com.pujan.userservice.model;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.*;

class CommonTableTest {

    @Test
    void testUsersPrePersist() {
        Users user = new Users();
        user.setUsername("testuser");
        
        // Trigger PrePersist logic manually since we are not in a full JPA container here
        user.onPrePersist();
        
        assertEquals("testuser", user.getEntryName());
        assertEquals("USER", user.getEntryType());
        assertEquals("USER_MANAGEMENT", user.getModuleName());
        assertNotNull(user.getEntryDateTime());
        assertEquals("CREATE", user.getLastAction());
    }

    @Test
    void testRolePrePersist() {
        Role role = new Role();
        role.setName("ADMIN");
        
        role.onPrePersist();
        
        assertEquals("ADMIN", role.getEntryName());
        assertEquals("ROLE", role.getEntryType());
        assertEquals("ROLE_MANAGEMENT", role.getModuleName());
    }
    
    @Test
    void testModulePrePersist() {
        Module module = new Module();
        module.setDisplayName("User Module");
        
        module.onPrePersist();
        
        assertEquals("User Module", module.getEntryName());
        assertEquals("MODULE", module.getEntryType());
        assertEquals("MODULE_MANAGEMENT", module.getModuleName());
    }
    
    @Test
    void testUsersPreUpdate() {
        Users user = new Users();
        user.setUsername("updateduser");
        user.setEntryName("oldname");
        
        user.onPreUpdate();
        
        assertEquals("updateduser", user.getEntryName());
        assertEquals("UPDATE", user.getLastAction());
    }
}
