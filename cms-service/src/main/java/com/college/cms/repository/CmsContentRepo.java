package com.college.cms.repository;


import com.college.cms.model.CmsContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CmsContentRepo extends JpaRepository<CmsContent, Long> {
    List<CmsContent> findByModuleCode(String code);
}