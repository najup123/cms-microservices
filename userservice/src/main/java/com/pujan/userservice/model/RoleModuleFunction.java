package com.pujan.userservice.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@ToString(exclude = {"role", "module"})
@EqualsAndHashCode(exclude = {"role"})
@Table(name = "role_module_functions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"role_id", "module_id", "function_id"}))
public class RoleModuleFunction extends CommonTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    @Column(name = "function_id", nullable = false)
    private Integer functionId;

    @Override
    protected String provideEntryName() {
        return "R:" + (role != null ? role.getId() : "?") + "-M:" + (module != null ? module.getId() : "?");
    }

    @Override
    protected String provideEntryType() {
        return "PERMISSION";
    }

    @Override
    protected String provideModuleName() {
        return "PERMISSION_MANAGEMENT";
    }
}
