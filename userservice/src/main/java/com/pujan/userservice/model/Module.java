package com.pujan.userservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public class Module extends CommonTable{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String displayName;

    @Column(unique = true)
    private String code;

    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    @Builder.Default
    private Set<RoleModuleFunction> permissions = new HashSet<>();

    @Override
    protected String provideEntryName() {
        return this.displayName != null ? this.displayName : this.code;
    }

    @Override
    protected String provideEntryType() {
        return "MODULE";
    }

    @Override
    protected String provideModuleName() {
        return "MODULE_MANAGEMENT";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Module)) return false;
        Module module = (Module) o;
        return id != null && id.equals(module.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
