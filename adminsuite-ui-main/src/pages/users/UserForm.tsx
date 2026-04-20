import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/ui/page-header';
import { usersApi, rolesApi } from '@/lib/api';
import { mockRoles } from '@/lib/mock-data';
import { Role } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const UserForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const { isSuperAdmin, user: currentUser, login, logout, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    roles: [] as string[],
  });

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      try {
        return await rolesApi.getAll();
      } catch {
        return mockRoles;
      }
    },
  });

  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(Number(id)),
    enabled: isEditing,
  });

  const isInitialized = useRef(false);

  // Reset initialization when user ID changes
  useEffect(() => {
    isInitialized.current = false;
  }, [id]);

  useEffect(() => {
    if (user && !isInitialized.current) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        roles: user.roles?.map((r: Role) => r.name).filter(Boolean) || [],
      });
      isInitialized.current = true;
    }
  }, [id, user]);

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (isEditing) {
        // Only send password if user typed one (though input is hidden, keeping logic safe)
        const payload = {
          username: data.username,
          email: data.email,
          roles: data.roles,
          password: data.password.trim() === '' ? undefined : data.password
        };
        return usersApi.update(Number(id), payload);
      }
      return usersApi.create(data);
    },
    onSuccess: (data) => {
      // Check if response contains a new token (handling both direct object and token response)
      const newToken = data.token;

      // Check if user updated themselves
      if (isEditing && currentUser?.username === (user?.username || formData.username)) {
        // User updated themselves - force logout to refresh JWT deeply
        logout();
        toast({ title: 'Profile updated. Please login again to apply changes.' });
        navigate('/login');
      } else {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        toast({ title: `User ${isEditing ? 'updated' : 'created'} successfully` });
        navigate('/users');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to save user';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim()) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    if (!isEditing && !formData.password.trim()) {
      toast({ title: 'Password is required for new users', variant: 'destructive' });
      return;
    }
    mutation.mutate(formData);
  };

  const toggleRole = (roleName: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(roleName)
        ? prev.roles.filter((name) => name !== roleName)
        : [...prev.roles, roleName],
    }));
  };

  // Filter roles based on permissions
  const availableRoles = roles.filter(role => {
    if ((role.name === 'ROLE_SUPER_ADMIN' || role.name === 'SUPER_ADMIN') && !isSuperAdmin) {
      return false;
    }
    return true;
  });

  if (isEditing && userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEditing && userError) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="User Not Found"
          description="The user you're trying to edit could not be found or you don't have permission to access it."
          action={
            <Button variant="outline" onClick={() => navigate('/users')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEditing ? 'Edit User' : 'Create User'}
        description={isEditing ? 'Update user details and roles' : 'Add a new user to the system'}
        action={
          <Button variant="outline" onClick={() => navigate('/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                  placeholder="Enter username"
                  disabled={mutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Enter email"
                  disabled={mutation.isPending}
                />
              </div>
            </div>

            {/* Password Field - ONLY show when creating new user */}
            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Enter password"
                  disabled={mutation.isPending}
                />
              </div>
            )}

            <div className="space-y-3">
              <Label>Roles</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {availableRoles.map((role, index) => (
                  <div
                    key={role.name || index}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`role-${role.name}`}
                      checked={formData.roles.includes(role.name || '')}
                      onCheckedChange={() => toggleRole(role.name || '')}
                      disabled={mutation.isPending}
                    />
                    <Label
                      htmlFor={`role-${role.name}`}
                      className="flex-1 cursor-pointer text-sm font-medium"
                    >
                      {(role.name || '').replace('ROLE_', '')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update User' : 'Create User'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/users')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserForm;