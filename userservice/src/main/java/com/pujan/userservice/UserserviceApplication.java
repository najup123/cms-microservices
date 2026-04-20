package com.pujan.userservice;

import com.pujan.userservice.model.Module;
import com.pujan.userservice.model.Role;
import com.pujan.userservice.model.RoleModuleFunction;
import com.pujan.userservice.model.Users;
import com.pujan.userservice.repository.ModuleRepo;
import com.pujan.userservice.repository.RoleRepo;
import com.pujan.userservice.repository.UsersRepo;
import com.pujan.userservice.rbac.StaticFunction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;

@SpringBootApplication
@EnableDiscoveryClient
public class UserserviceApplication implements CommandLineRunner {

	@Autowired
	private UsersRepo usersRepo;

	@Autowired
	private RoleRepo roleRepo;

	@Autowired
	private ModuleRepo moduleRepo;

	@Autowired
	private PasswordEncoder passwordEncoder;

	public static void main(String[] args) {
		SpringApplication.run(UserserviceApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {
		// Create default roles if they don't exist
		if (roleRepo.findByName("ROLE_USER").isEmpty()) {
			Role userRole = new Role();
			userRole.setName("ROLE_USER");
			roleRepo.save(userRole);
		}

		if (roleRepo.findByName("ROLE_ADMIN").isEmpty()) {
			Role adminRole = new Role();
			adminRole.setName("ROLE_ADMIN");
			roleRepo.save(adminRole);
		}

		if (roleRepo.findByName("ROLE_SUPER_ADMIN").isEmpty()) {
			Role superAdminRole = new Role();
			superAdminRole.setName("ROLE_SUPER_ADMIN");
			roleRepo.save(superAdminRole);
		}

		if (roleRepo.findByName("ROLE_EDITOR").isEmpty()) {
			Role editorRole = new Role();
			editorRole.setName("ROLE_EDITOR");
			roleRepo.save(editorRole);
		}

		// Seed demo modules logic removed
//		// Explicitly delete "User Management" and "Settings" if they exist (Cleanup)
//		moduleRepo.findByCode("USER_MANAGEMENT").ifPresent(module -> {
//			moduleRepo.delete(module);
//			System.out.println("Purged USER_MANAGEMENT module.");
//		});
//		moduleRepo.findByCode("SETTINGS").ifPresent(module -> {
//			moduleRepo.delete(module);
//			System.out.println("Purged SETTINGS module.");
//		});
		// Modules initialization removed as per user request to prevent recreation after deletion
		// Code block for "User Management" and "Settings" initialization was here

        // Module "About Us" and its permissions removed as per user request

		// Create default admin user if it doesn't exist
		// Demo users creation removed as per user request
	}

	private void addFullCrud(Role role, Module module) {
		addPermission(role, module, StaticFunction.SELECT);
		addPermission(role, module, StaticFunction.CREATE);
		addPermission(role, module, StaticFunction.UPDATE);
		addPermission(role, module, StaticFunction.DELETE);
	}

	private void addSelectCreateUpdate(Role role, Module module) {
		addPermission(role, module, StaticFunction.SELECT);
		addPermission(role, module, StaticFunction.CREATE);
		addPermission(role, module, StaticFunction.UPDATE);
	}

	private void addSelectUpdate(Role role, Module module) {
		addPermission(role, module, StaticFunction.SELECT);
		addPermission(role, module, StaticFunction.UPDATE);
	}

	private void addSelectOnly(Role role, Module module) {
		addPermission(role, module, StaticFunction.SELECT);
	}

	private void addPermission(Role role, Module module, int functionId) {
		RoleModuleFunction rmf = RoleModuleFunction.builder()
				.role(role)
				.module(module)
				.functionId(functionId)
				.build();
		role.getPermissions().add(rmf);
	}

	@org.springframework.context.annotation.Bean
	@org.springframework.cloud.client.loadbalancer.LoadBalanced
	public org.springframework.web.client.RestTemplate restTemplate() {
		return new org.springframework.web.client.RestTemplate();
	}

}
