import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, MoreHorizontal, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { rolesApi } from '@/lib/api';
import { mockRoles } from '@/lib/mock-data';
import { Role } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

export const RoleList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      try {
        return await rolesApi.getAll();
      } catch {
        return mockRoles;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({ title: 'Role deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete role', variant: 'destructive' });
    },
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const columns = [
    { key: 'id', header: 'ID', className: 'w-16' },
    {
      key: 'name',
      header: 'Role Name',
      render: (role: Role) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-medium">{role.name}</span>
        </div>
      ),
    },
    {
      key: 'modules',
      header: 'Modules',
      render: (role: Role) => (
        <span className="text-muted-foreground">
          {role.modules?.length || 0} module(s)
        </span>
      ),
    },
    {
      key: 'permissions',
      header: 'Total Permissions',
      render: (role: Role) => {
        const totalPerms = role.modules?.reduce(
          (acc, m) => acc + (m.functionIds?.length || 0),
          0
        ) || 0;
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
            {totalPerms} permission(s)
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'w-16',
      render: (role: Role) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/roles/${role.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteId(role.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Roles"
        description="Manage roles and their module permissions"
        action={
          <Button onClick={() => navigate('/roles/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </Button>
        }
      />

      <DataTable
        data={roles}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No roles found"
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? Users with this role will lose these permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoleList;
