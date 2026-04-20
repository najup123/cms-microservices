import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, MoreHorizontal, Boxes } from 'lucide-react';
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
import { modulesApi } from '@/lib/api';
import { mockModules } from '@/lib/mock-data';
import { Module } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export const ModuleList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      try {
        return await modulesApi.getAll();
      } catch {
        return mockModules;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => modulesApi.delete(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      if (refreshProfile) {
        await refreshProfile();
      }
      toast({ title: 'Module deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete module', variant: 'destructive' });
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
      header: 'Display Name',
      render: (module: Module) => (
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-primary" />
          <span className="font-medium">{module.displayName || module.name}</span>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      render: (module: Module) => (
        <code className="px-2 py-1 text-xs rounded bg-muted font-mono">
          {module.code}
        </code>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (module: Module) => (
        <span className="text-muted-foreground text-sm">
          {module.description || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-16',
      render: (module: Module) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/modules/${module.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteId(module.id)}
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
        title="Modules"
        description="Manage system modules that define application features"
        action={
          <Button onClick={() => navigate('/modules/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        }
      />

      <DataTable
        data={modules}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No modules found"
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this module? Roles using this module will lose access to it.
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

export default ModuleList;
