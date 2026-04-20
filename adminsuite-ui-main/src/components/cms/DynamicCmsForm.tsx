import React, { useState, useEffect } from 'react';
import { CmsField, CmsSchema } from '@/types/cms';
import { FormField } from './FormField';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DynamicCmsFormProps {
    schema: CmsSchema;
    initialData?: Record<string, any>;
    onSubmit: (data: Record<string, any>) => void;
    onCancel?: () => void;
    isLoading?: boolean;
    mode?: 'create' | 'edit';
}

const EMPTY_OBJECT = {};

export const DynamicCmsForm: React.FC<DynamicCmsFormProps> = ({
    schema,
    initialData = EMPTY_OBJECT,
    onSubmit,
    onCancel,
    isLoading = false,
    mode = 'create',
}) => {
    const [formData, setFormData] = useState<Record<string, any>>(initialData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Update form data when initialData changes, but only if it's not the stable empty object
    // or if we really want to reset (like switching edit items)
    useEffect(() => {
        if (initialData !== EMPTY_OBJECT) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleFieldChange = (fieldName: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
        // Clear error when user starts typing
        if (errors[fieldName]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        schema.fields.forEach(field => {
            const value = formData[field.name];

            // Required field validation
            if (field.required && !value && value !== 0 && value !== false) {
                newErrors[field.name] = `${field.label || field.name} is required`;
                return;
            }

            // Email validation
            if (field.type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    newErrors[field.name] = 'Please enter a valid email address';
                }
            }

            // URL validation
            if (field.type === 'url' && value) {
                try {
                    new URL(value);
                } catch {
                    newErrors[field.name] = 'Please enter a valid URL';
                }
            }

            // Number validation
            if (field.type === 'number' && value !== '' && value !== null && value !== undefined) {
                const numValue = Number(value);
                if (isNaN(numValue)) {
                    newErrors[field.name] = 'Please enter a valid number';
                } else {
                    if (field.validation?.min !== undefined && numValue < field.validation.min) {
                        newErrors[field.name] = `Minimum value is ${field.validation.min}`;
                    }
                    if (field.validation?.max !== undefined && numValue > field.validation.max) {
                        newErrors[field.name] = `Maximum value is ${field.validation.max}`;
                    }
                }
            }

            // String length validation
            if (field.type === 'text' || field.type === 'textarea') {
                if (field.validation?.minLength && value && value.length < field.validation.minLength) {
                    newErrors[field.name] = `Minimum length is ${field.validation.minLength} characters`;
                }
                if (field.validation?.maxLength && value && value.length > field.validation.maxLength) {
                    newErrors[field.name] = `Maximum length is ${field.validation.maxLength} characters`;
                }
            }

            // Custom pattern validation
            if (field.validation?.pattern && value) {
                const regex = new RegExp(field.validation.pattern);
                if (!regex.test(value)) {
                    newErrors[field.name] = field.validation.message || 'Invalid format';
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        onSubmit(formData);
    };

    const handleClear = () => {
        setFormData({});
        setErrors({});
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <ScrollArea className="h-[55vh] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                    {schema.fields.map((field) => (
                        <FormField
                            key={field.name}
                            field={field}
                            value={formData[field.name]}
                            onChange={(value) => handleFieldChange(field.name, value)}
                            error={errors[field.name]}
                        />
                    ))}
                </div>
            </ScrollArea>

            <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-2">
                    {mode === 'create' && Object.keys(formData).length > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClear}
                            disabled={isLoading}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Clear
                        </Button>
                    )}
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                    )}
                </div>

                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {mode === 'create' ? 'Creating...' : 'Updating...'}
                        </>
                    ) : (
                        mode === 'create' ? 'Create Entry' : 'Update Entry'
                    )}
                </Button>
            </div>
        </form>
    );
};
