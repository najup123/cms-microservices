package com.pujan.userservice.repository;

import com.pujan.userservice.model.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ModuleRepo extends JpaRepository<Module, Long> {

    Optional<Module> findByDisplayName(String displayName);

    Optional<Module> findByCode(String code);

    boolean existsByDisplayName(String displayName);

    boolean existsByCode(String code);
}
