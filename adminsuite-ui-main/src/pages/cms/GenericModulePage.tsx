import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Plus, Loader2, Edit, Trash2, Eye, ShieldCheck, Calendar, Mail, Link2, ImageIcon, LayoutGrid, LayoutList, AlertTriangle } from 'lucide-react';
import { DynamicCmsForm } from '@/components/cms/DynamicCmsForm';
import { ContentDetail } from '@/components/cms/ContentDetail';
import { cmsApi, modulesApi } from '@/lib/api';

const GenericModulePage: React.FC = () => {
    const { moduleCode } = useParams<{ moduleCode: string }>();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const { data: schema, isLoading: isSchemaLoading } = useQuery({
        queryKey: ['schema', moduleCode],
        queryFn: async () => {
            try {
                return await cmsApi.getSchema(moduleCode!);
            } catch {
                return null;
            }
        },
        enabled: !!moduleCode,
    });

    const { data: content, isLoading: isContentLoading } = useQuery({
        queryKey: ['content', moduleCode],
        queryFn: () => cmsApi.getContent(moduleCode!),
        enabled: !!moduleCode,
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => cmsApi.createContent(moduleCode!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['content', moduleCode] });
            setIsCreateDialogOpen(false);
            toast({ title: 'Success', description: 'Entry created successfully' });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error?.response?.data?.message || 'Failed to create entry',
                variant: 'destructive'
            });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) =>
            cmsApi.updateContent(moduleCode!, id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['content', moduleCode] });
            setIsEditDialogOpen(false);
            setSelectedItem(null);
            toast({ title: 'Success', description: 'Entry updated successfully' });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error?.response?.data?.message || 'Failed to update entry',
                variant: 'destructive'
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => cmsApi.deleteContent(moduleCode!, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['content', moduleCode] });
            setIsDeleteDialogOpen(false);
            setSelectedItem(null);
            toast({ title: 'Success', description: 'Entry deleted successfully' });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error?.response?.data?.message || 'Failed to delete entry',
                variant: 'destructive'
            });
        }
    });



    // Permission checks
    const checkPermission = (functionId: number) => {
        if (!user?.roles) return false;
        if (user.roles.some(role => role.name === 'ROLE_SUPER_ADMIN')) return true;
        return user.roles.some(role => {
            if (role.modules && Array.isArray(role.modules)) {
                return role.modules.some((mod: any) =>
                    (mod.moduleCode === moduleCode || mod.moduleName === moduleCode) &&
                    mod.functionIds?.some((fid: number) => fid === functionId)
                );
            }
            return false;
        });
    };

    const hasModuleAssigned = () => {
        if (!user?.roles) return false;
        if (user.roles.some(role => role.name === 'ROLE_SUPER_ADMIN')) return true;
        return user.roles.some(role => {
            if (role.modules && Array.isArray(role.modules)) {
                return role.modules.some((mod: any) =>
                    mod.moduleCode === moduleCode || mod.moduleName === moduleCode
                );
            }
            return false;
        });
    };

    // CRITICAL: These function IDs MUST match StaticFunction constants in backend
    // StaticFunction: SELECT=1, UPDATE=2, CREATE=3, DELETE=4
    const hasCreatePermission = checkPermission(3);  // StaticFunction.CREATE
    const hasSelectPermission = checkPermission(1) || hasModuleAssigned();  // StaticFunction.SELECT
    const hasUpdatePermission = checkPermission(2);  // StaticFunction.UPDATE
    const hasDeletePermission = checkPermission(4);  // StaticFunction.DELETE
    const isAdminView = hasCreatePermission || hasUpdatePermission || hasDeletePermission;

    if (isSchemaLoading || isContentLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        );
    }

    if (!hasSelectPermission) {
        return (
            <div className="p-8 text-center bg-destructive/5 rounded-lg border border-destructive/20 m-4">
                <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-6">You don't have permission to view this module.</p>
                <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-yellow-600 dark:text-yellow-500 font-medium">
                        If you are an admin, permissions might be missing in the database.
                    </p>
                    <Button
                        onClick={async () => {
                            try {
                                await modulesApi.fixPermissions();
                                toast({ title: 'Permissions Fixed', description: 'Please refresh the page.' });
                                setTimeout(() => window.location.reload(), 1000);
                            } catch (err) {
                                toast({ title: 'Error', description: 'Failed to fix permissions', variant: 'destructive' });
                            }
                        }}
                        variant="outline"
                        className="mt-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                    >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Auto-Fix Permissions
                    </Button>
                </div>
            </div>
        );
    }

    const defaultSchema = {
        displayName: moduleCode,
        fields: [
            { name: "Title", type: "text", label: "Title", required: true, gridWidth: 2 },
            { name: "Subtitle", type: "text", label: "Subtitle", gridWidth: 2 },
            { name: "Content", type: "rich-text", label: "Main Content", gridWidth: 2 },
            { name: "Description", type: "textarea", label: "Description", gridWidth: 2 },
            { name: "Image", type: "image", label: "Featured Image", gridWidth: 1 },
            { name: "Email", type: "email", label: "Email", gridWidth: 1 },
            { name: "URL", type: "url", label: "Website", gridWidth: 1 },
            { name: "Date", type: "date", label: "Date", gridWidth: 1 },
            { name: "Published", type: "toggle", label: "Published", defaultValue: true, gridWidth: 1 }
        ]
    };

    const effectiveSchema = schema || defaultSchema;
    const fields = effectiveSchema.fields || [];

    // Render beautiful public/user view
    const renderPublicView = () => {
        // Singleton Heuristic
        const isSingletonModule = ['about', 'contact', 'terms', 'privacy', 'policy', 'mission', 'vision'].some(keyword =>
            moduleCode?.toLowerCase().includes(keyword) ||
            (effectiveSchema.displayName && effectiveSchema.displayName.toLowerCase().includes(keyword))
        );

        const publishedContent = content?.filter((item: any) => {
            const data = item.data || {};
            // Robust check using string conversion
            return String(data.Published).toLowerCase() !== 'false' && String(data.published).toLowerCase() !== 'false';
        }) || [];

        const showSingleView = publishedContent.length === 1 || (publishedContent.length > 0 && isSingletonModule);

        if (showSingleView) {
            return (
                <div className="max-w-4xl mx-auto mt-8">
                    <ContentDetail data={publishedContent[0].data || {}} schema={effectiveSchema} />
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg p-8 border border-primary/20">
                    <h1 className="text-4xl font-bold mb-2">{effectiveSchema.displayName}</h1>
                    <p className="text-muted-foreground">Explore our {effectiveSchema.displayName?.toLowerCase()} content</p>
                </div>

                {content && content.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {content.map((item: any) => (
                            <Card
                                key={item.id}
                                className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer"
                                onClick={() => {
                                    setSelectedItem(item);
                                    setIsDetailDialogOpen(true);
                                }}
                            >
                                {item.data?.Image && (
                                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                                        <img
                                            src={item.data.Image}
                                            alt={item.data?.Title || 'Image'}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="line-clamp-2">{item.data?.Title || 'Untitled'}</CardTitle>
                                    {item.data?.Subtitle && (
                                        <CardDescription className="line-clamp-1">{item.data.Subtitle}</CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {item.data?.Description && (
                                        <p className="text-sm text-muted-foreground line-clamp-3">{item.data.Description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                                        {item.data?.Date && (
                                            <Badge variant="secondary" className="text-xs">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {new Date(item.data.Date).toLocaleDateString()}
                                            </Badge>
                                        )}
                                        {item.data?.Email && (
                                            <Badge variant="outline" className="text-xs">
                                                <Mail className="h-3 w-3 mr-1" />
                                                Contact
                                            </Badge>
                                        )}
                                        {item.data?.URL && (
                                            <Badge variant="outline" className="text-xs">
                                                <Link2 className="h-3 w-3 mr-1" />
                                                Website
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="p-12">
                        <div className="text-center">
                            <Eye className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-xl text-muted-foreground">No content available yet</p>
                            <p className="text-sm text-muted-foreground mt-2">Check back soon for updates!</p>
                        </div>
                    </Card>
                )}
            </div>
        );
    };

    // Render professional admin dashboard
    const renderAdminView = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{effectiveSchema.displayName}</h1>
                    <p className="text-muted-foreground mt-1">Manage your {effectiveSchema.displayName?.toLowerCase()} entries</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                    >
                        {viewMode === 'table' ? <LayoutGrid className="h-4 w-4" /> : <LayoutList className="h-4 w-4" />}
                    </Button>
                    {hasCreatePermission && (
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button><Plus className="mr-2 h-4 w-4" /> Add New</Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Add New {effectiveSchema.displayName}</DialogTitle>
                                </DialogHeader>
                                <DynamicCmsForm
                                    schema={effectiveSchema}
                                    onSubmit={(data) => createMutation.mutate(data)}
                                    isLoading={createMutation.isPending}
                                    mode="create"
                                    onCancel={() => setIsCreateDialogOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>


            {
                content && content.length > 0 ? (
                    viewMode === 'table' ? (
                        <Card>
                            <CardContent className="p-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[60px]">ID</TableHead>
                                            {fields.slice(0, 6).map((f: any) => (
                                                <TableHead key={f.name}>{f.label || f.name}</TableHead>
                                            ))}
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {content.map((item: any) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.id}</TableCell>
                                                {fields.slice(0, 6).map((f: any) => (
                                                    <TableCell key={f.name} className="max-w-[200px] truncate">
                                                        {typeof item.data?.[f.name] === 'boolean'
                                                            ? (item.data[f.name] ? '✓' : '✗')
                                                            : item.data?.[f.name] || '-'}
                                                    </TableCell>
                                                ))}
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {hasUpdatePermission && (
                                                            <Button variant="ghost" size="sm" onClick={() => {
                                                                setSelectedItem(item);
                                                                setIsEditDialogOpen(true);
                                                            }}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {hasDeletePermission && (
                                                            <Button variant="ghost" size="sm" onClick={() => {
                                                                setSelectedItem(item);
                                                                setIsDeleteDialogOpen(true);
                                                            }}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {content.map((item: any) => (
                                <Card key={item.id} className="group hover:shadow-md transition-shadow">
                                    {item.data?.Image && (
                                        <div
                                            className="relative h-40 overflow-hidden bg-muted cursor-pointer"
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setIsDetailDialogOpen(true);
                                            }}
                                        >
                                            <img src={item.data.Image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle
                                                className="text-lg line-clamp-2 cursor-pointer hover:text-primary"
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setIsDetailDialogOpen(true);
                                                }}
                                            >
                                                {item.data?.Title || 'Untitled'}
                                            </CardTitle>
                                            <span className="text-xs text-muted-foreground">#{item.id}</span>
                                        </div>
                                        {item.data?.Subtitle && (
                                            <CardDescription className="line-clamp-2">{item.data.Subtitle}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setIsDetailDialogOpen(true);
                                                }}
                                            >
                                                <Eye className="h-3 w-3 mr-1" /> View
                                            </Button>
                                            {hasUpdatePermission && (
                                                <Button variant="outline" size="sm" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedItem(item);
                                                    setIsEditDialogOpen(true);
                                                }}>
                                                    <Edit className="h-3 w-3 mr-1" /> Edit
                                                </Button>
                                            )}
                                            {hasDeletePermission && (
                                                <Button variant="outline" size="sm" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedItem(item);
                                                    setIsDeleteDialogOpen(true);
                                                }}>
                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )
                ) : (
                    <Card className="p-12">
                        <div className="text-center">
                            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-lg">No entries found</p>
                            {hasCreatePermission && (
                                <p className="text-sm text-muted-foreground mt-2">Click "Add New" to create your first entry</p>
                            )}
                        </div>
                    </Card>
                )
            }

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit {effectiveSchema.displayName}</DialogTitle>
                    </DialogHeader>
                    <DynamicCmsForm
                        schema={effectiveSchema}
                        initialData={selectedItem?.data}
                        onSubmit={(data) => {
                            if (selectedItem) {
                                updateMutation.mutate({ id: selectedItem.id, data });
                            }
                        }}
                        isLoading={updateMutation.isPending}
                        mode="edit"
                        onCancel={() => setIsEditDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this entry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedItem && deleteMutation.mutate(selectedItem.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Detail View Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedItem?.data?.Title || 'Content Details'}</DialogTitle>
                        {selectedItem?.data?.Subtitle && (
                            <CardDescription>{selectedItem.data.Subtitle}</CardDescription>
                        )}
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-6">
                            {selectedItem.data?.Image && (
                                <div className="relative h-64 overflow-hidden rounded-lg bg-muted">
                                    <img
                                        src={selectedItem.data.Image}
                                        alt={selectedItem.data?.Title || 'Image'}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="grid gap-4">
                                {fields.map((field: any) => {
                                    const value = selectedItem.data?.[field.name];
                                    if (!value && value !== false) return null;

                                    return (
                                        <div key={field.name} className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground">
                                                {field.label || field.name}
                                            </label>
                                            <div className="text-sm">
                                                {field.type === 'rich-text' ? (
                                                    <div
                                                        className="prose prose-sm max-w-none"
                                                        dangerouslySetInnerHTML={{ __html: value }}
                                                    />
                                                ) : field.type === 'toggle' ? (
                                                    <Badge variant={value ? 'default' : 'secondary'}>
                                                        {value ? 'Yes' : 'No'}
                                                    </Badge>
                                                ) : field.type === 'image' ? (
                                                    <img
                                                        src={value}
                                                        alt={field.label}
                                                        className="max-w-xs rounded-lg"
                                                    />
                                                ) : field.type === 'url' ? (
                                                    <a
                                                        href={value}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        <Link2 className="h-3 w-3" />
                                                        {value}
                                                    </a>
                                                ) : field.type === 'email' ? (
                                                    <a
                                                        href={`mailto:${value}`}
                                                        className="text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        <Mail className="h-3 w-3" />
                                                        {value}
                                                    </a>
                                                ) : field.type === 'date' ? (
                                                    <Badge variant="secondary">
                                                        <Calendar className="h-3 w-3 mr-1" />
                                                        {new Date(value).toLocaleDateString()}
                                                    </Badge>
                                                ) : (
                                                    <p className="whitespace-pre-wrap">{value}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex gap-2 pt-4 border-t">
                                {hasUpdatePermission && (
                                    <Button
                                        variant="default"
                                        onClick={() => {
                                            setIsDetailDialogOpen(false);
                                            setIsEditDialogOpen(true);
                                        }}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                )}
                                {hasDeletePermission && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            setIsDetailDialogOpen(false);
                                            setIsDeleteDialogOpen(true);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDetailDialogOpen(false)}
                                    className="ml-auto"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );

    return isAdminView ? renderAdminView() : renderPublicView();
};

export default GenericModulePage;
