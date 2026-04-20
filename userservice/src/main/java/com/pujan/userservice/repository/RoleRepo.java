package com.pujan.userservice.repository;

import com.pujan.userservice.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleRepo extends JpaRepository<Role, Long> {

    Optional<Role> findByName(String name);

    @Query("select distinct r from Role r left join fetch r.permissions p left join fetch p.module m where r.name = :name")
    Optional<Role> findByNameWithPermissions(@Param("name") String name);

    @Query("select distinct r from Role r left join fetch r.permissions p left join fetch p.module m")
    List<Role> findAllWithPermissions();

    @Query("select count(u) from Users u join u.roles r where r.id = :roleId")
    long countUsersWithRole(@Param("roleId") Long roleId);

}
