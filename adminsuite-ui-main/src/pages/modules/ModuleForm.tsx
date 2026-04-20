import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { modulesApi, cmsApi } from '@/lib/api';
import { mockModules } from '@/lib/mock-data';
import { Module } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const ModuleForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const { data: module, isLoading: moduleLoading } = useQuery<Module>({
    queryKey: ['module', id],
    queryFn: async () => {
      try {
        return await modulesApi.getById(Number(id));
      } catch {
        return mockModules.find(m => m.id === Number(id));
      }
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (module) {
      setFormData({
        name: module.displayName || module.name || '',
        code: module.code || '',
        description: module.description || '',
      });
    }
  }, [module]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // FIX: Backend ModuleController expects 'displayName', not 'name'
      const payload = {
        displayName: data.name,
        code: data.code,
        // The current backend entity doesn't show a description field in the DTO,
        // but we send it anyway just in case it was added.
        description: data.description
      };

      if (isEditing) {
        return modulesApi.update(Number(id), payload);
      }

      // 1. Create Module
      const module = await modulesApi.create(payload);

      // 2. Create Default Schema (if new module)
      let schemaError = null;
      try {
        await cmsApi.createSchema({
          moduleCode: data.code,
          displayName: data.name,
          fields: [
            { name: "Title", type: "text", label: "Title", required: true, gridWidth: 2, placeholder: "Enter title" },
            { name: "Subtitle", type: "text", label: "Subtitle", gridWidth: 2, placeholder: "Enter subtitle" },
            { name: "Content", type: "rich-text", label: "Main Content", gridWidth: 2, placeholder: "Write your content here..." },
            { name: "Description", type: "textarea", label: "Short Description", gridWidth: 2, placeholder: "Brief description" },
            { name: "Image", type: "image", label: "Featured Image", gridWidth: 1 },
            { name: "Gallery", type: "image", label: "Additional Images", gridWidth: 1 },
            { name: "URL", type: "url", label: "Link URL", gridWidth: 1, placeholder: "https://example.com" },
            { name: "Email", type: "email", label: "Contact Email", gridWidth: 1, placeholder: "email@example.com" },
            { name: "Date", type: "date", label: "Event/Publication Date", gridWidth: 1 },
            { name: "Status", type: "select", label: "Status", options: ["Draft", "Published", "Archived"], gridWidth: 1 },
            { name: "Featured", type: "toggle", label: "Featured", defaultValue: false, gridWidth: 1 },
            { name: "Published", type: "toggle", label: "Published", defaultValue: true, gridWidth: 1 }
          ]
        });
      } catch (err) {
        console.error("Failed to create default schema", err);
        schemaError = err;
      }

      return { ...module, schemaError };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });

      if (refreshProfile) {
        await refreshProfile();
      }

      if (data.schemaError) {
        toast({
          title: 'Module created with warnings',
          description: 'Schema creation failed. Please initialize it in the module page.',
          variant: 'destructive'
        });
      } else {
        toast({ title: `Module ${isEditing ? 'updated' : 'created'} successfully` });
      }

      navigate('/modules');
    },
    onError: (error: any) => {
      const message = error.response?.data || 'Failed to save module';
      toast({ title: 'Error', description: typeof message === 'string' ? message : 'Failed to save module', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    mutation.mutate(formData);
  };

  const generateCode = () => {
    const code = formData.name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    setFormData((p) => ({ ...p, code }));
  };

  if (isEditing && moduleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEditing ? 'Edit Module' : 'Create Module'}
        description={isEditing ? 'Update module details' : 'Define a new system module'}
        action={
          <Button variant="outline" onClick={() => navigate('/modules')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Module Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., User Management"
                onBlur={() => !formData.code && generateCode()}
                disabled={mutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., USER_MANAGEMENT"
                  className="font-mono"
                  disabled={mutation.isPending}
                />
                <Button type="button" variant="outline" onClick={generateCode} disabled={mutation.isPending}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Unique identifier used in the system (uppercase, underscores)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of what this module does..."
                rows={3}
                disabled={mutation.isPending}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Module' : 'Create Module'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/modules')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModuleForm;