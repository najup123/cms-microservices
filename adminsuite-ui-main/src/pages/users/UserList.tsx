import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
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
import { usersApi } from '@/lib/api';
import { mockUsers } from '@/lib/mock-data';
import { User } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

export const UserList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        return await usersApi.getAll();
      } catch {
        return mockUsers;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete user', variant: 'destructive' });
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
    { key: 'username', header: 'Username' },
    { key: 'email', header: 'Email' },
    {
      key: 'roles',
      header: 'Roles',
      render: (user: User) => (
        <div className="flex flex-wrap gap-1">
          {user.roles?.map((role) => (
            <span
              key={role.id}
              className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary"
            >
              {(role.name || '').replace('ROLE_', '')}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-16',
      render: (user: User) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/users/${user.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteId(user.id)}
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
        title="Users"
        description="Manage system users and their role assignments"
        action={
          <Button onClick={() => navigate('/users/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        }
      />

      <DataTable
        data={users}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No users found"
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
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

export default UserList;
