import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/ui/page-header';
import { rolesApi, modulesApi } from '@/lib/api';
import { mockModules, mockRoles } from '@/lib/mock-data';
import { Module, FUNCTION_LIST, Role, RoleModule } from '@/types';
import { toast } from '@/hooks/use-toast';
import { AddModuleModal } from '@/components/AddModuleModal';

interface ModulePermissions {
  [moduleId: number]: number[];
}

export const RoleForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [modulePermissions, setModulePermissions] = useState<ModulePermissions>({});

  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      try {
        return await modulesApi.getAll();
      } catch {
        return mockModules;
      }
    },
  });

  const { data: role, isLoading: roleLoading } = useQuery<Role>({
    queryKey: ['role', id],
    queryFn: async () => {
      try {
        return await rolesApi.getById(Number(id));
      } catch {
        return mockRoles.find(r => r.id === Number(id));
      }
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (role) {
      setName(role.name || '');
      const perms: ModulePermissions = {};
      role.modules?.forEach((m: RoleModule) => {
        perms[m.moduleId] = m.functionIds || [];
      });
      setModulePermissions(perms);
    }
  }, [role]);

  const mutation = useMutation({
    mutationFn: (data: { name: string; modules: { moduleId: number; functionIds: number[] }[] }) => {
      if (isEditing) {
        return rolesApi.update(Number(id), data);
      }
      return rolesApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({ title: `Role ${isEditing ? 'updated' : 'created'} successfully` });
      navigate('/roles');
    },
    onError: () => {
      toast({ title: 'Failed to save role', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Please enter a role name', variant: 'destructive' });
      return;
    }

    const modulesPayload = Object.entries(modulePermissions)
      .filter(([_, functionIds]) => functionIds.length > 0)
      .map(([moduleId, functionIds]) => ({
        moduleId: Number(moduleId),
        functionIds,
      }));

    mutation.mutate({ name, modules: modulesPayload });
  };

  const togglePermission = (moduleId: number, functionId: number) => {
    setModulePermissions((prev) => {
      const current = prev[moduleId] || [];
      const updated = current.includes(functionId)
        ? current.filter((id) => id !== functionId)
        : [...current, functionId];
      return { ...prev, [moduleId]: updated };
    });
  };

  const toggleAllForModule = (moduleId: number) => {
    setModulePermissions((prev) => {
      const current = prev[moduleId] || [];
      const allIds = FUNCTION_LIST.map((f) => f.id);
      const hasAll = allIds.every((id) => current.includes(id));
      return { ...prev, [moduleId]: hasAll ? [] : allIds };
    });
  };

  const hasPermission = (moduleId: number, functionId: number) => {
    return modulePermissions[moduleId]?.includes(functionId) ?? false;
  };

  const hasAllPermissions = (moduleId: number) => {
    const current = modulePermissions[moduleId] || [];
    return FUNCTION_LIST.every((f) => current.includes(f.id));
  };

  if (isEditing && roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEditing ? 'Edit Role' : 'Create Role'}
        description={isEditing ? 'Update role name and permissions' : 'Define a new role with module permissions'}
        action={
          <Button variant="outline" onClick={() => navigate('/roles')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-md">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., ROLE_MANAGER"
              />
              <p className="text-xs text-muted-foreground">
                Use uppercase with ROLE_ prefix (e.g., ROLE_MANAGER)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Permissions Matrix</CardTitle>
              <CardDescription>
                Select which functions each module can access
              </CardDescription>
            </div>
            <AddModuleModal
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['modules'] });
                // We will add auth refresh logic later or assume it's handled in Modal
              }}
            />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Module</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground w-20">All</th>
                    {FUNCTION_LIST.map((func) => (
                      <th key={func.id} className="text-center py-3 px-2 font-medium text-muted-foreground w-20">
                        {func.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.map((module) => (
                    <tr key={module.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{module.displayName || module.name}</p>
                          <p className="text-xs text-muted-foreground">{module.code}</p>
                        </div>
                      </td>
                      <td className="text-center py-4 px-2">
                        <button
                          type="button"
                          onClick={() => toggleAllForModule(module.id)}
                          className={`w-8 h-8 rounded-md border flex items-center justify-center transition-colors ${hasAllPermissions(module.id)
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border hover:border-primary/50'
                            }`}
                        >
                          {hasAllPermissions(module.id) && <Check className="w-4 h-4" />}
                        </button>
                      </td>
                      {FUNCTION_LIST.map((func) => (
                        <td key={func.id} className="text-center py-4 px-2">
                          <Checkbox
                            checked={hasPermission(module.id, func.id)}
                            onCheckedChange={() => togglePermission(module.id, func.id)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {modules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No modules available. Create modules first.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Role' : 'Create Role'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/roles')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RoleForm;
