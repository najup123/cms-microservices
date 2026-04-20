import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { modulesApi, cmsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AddModuleModalProps {
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export const AddModuleModal: React.FC<AddModuleModalProps> = ({ onSuccess, trigger }) => {
    const [open, setOpen] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [code, setCode] = useState('');
    const queryClient = useQueryClient();
    const { refreshProfile } = useAuth();

    const resetForm = () => {
        setDisplayName('');
        setCode('');
    };

    const mutation = useMutation({
        mutationFn: async (data: { displayName: string; code: string }) => {
            // 1. Create Module in User Service
            const module = await modulesApi.create(data);

            let schemaError = null;
            // 2. Create Default Schema in CMS Service
            try {
                await cmsApi.createSchema({
                    moduleCode: data.code,
                    displayName: data.displayName,
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

            return { module, schemaError };
        },
        onSuccess: async ({ module, schemaError }) => {
            queryClient.invalidateQueries({ queryKey: ['modules'] });

            if (refreshProfile) {
                await refreshProfile();
            }

            if (schemaError) {
                toast({
                    title: 'Module created with warnings',
                    description: 'Schema creation failed. Please initialize it in the module page.',
                    variant: 'warning'
                });
            } else {
                toast({ title: 'Module created successfully' });
            }

            setOpen(false);
            resetForm();
            onSuccess?.();
        },
        onError: (error: any) => {
            const msg = error.response?.data || 'Failed to create module';
            toast({ title: msg, variant: 'destructive' });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim()) return;

        // Auto-generate code if empty
        const finalCode = code.trim() || displayName.trim().toUpperCase().replace(/\s+/g, '_');

        mutation.mutate({ displayName, code: finalCode });
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetForm();
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Module
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Module</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="module-name">Module Name *</Label>
                        <Input
                            id="module-name"
                            placeholder="e.g. Gallery"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="module-code">Module Code</Label>
                        <Input
                            id="module-code"
                            placeholder="e.g. GALLERY"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Leave blank to auto-generate from name (e.g. "User Profile" &rarr; "USER_PROFILE")
                        </p>
                    </div>

                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Module
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
