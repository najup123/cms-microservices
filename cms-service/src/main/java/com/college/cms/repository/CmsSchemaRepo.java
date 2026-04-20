package com.college.cms.repository;

import com.college.cms.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository public interface CmsSchemaRepo extends JpaRepository<CmsSchema, Long> {
    Optional<CmsSchema> findByModuleCode(String code);
}


