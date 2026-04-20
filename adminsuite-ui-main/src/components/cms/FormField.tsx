import React from 'react';
import { CmsField } from '@/types/cms';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Bold, Italic, List, Link as LinkIcon, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FormFieldProps {
    field: CmsField;
    value: any;
    onChange: (value: any) => void;
    error?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ field, value, onChange, error }) => {
    const fieldId = `field-${field.name.replace(/\s+/g, '-').toLowerCase()}`;
    const label = field.label || field.name;

    const renderInput = () => {
        switch (field.type) {
            case 'rich-text':
                return (
                    <div className={`border rounded-md ${error ? 'border-destructive' : 'border-input'} focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden bg-background`}>
                        <div className="flex items-center gap-1 border-b p-2 bg-muted/40">
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Bold">
                                <Bold className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Italic">
                                <Italic className="h-4 w-4" />
                            </Button>
                            <div className="w-px h-4 bg-border mx-1" />
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Bulleted List">
                                <List className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Link">
                                <LinkIcon className="h-4 w-4" />
                            </Button>
                        </div>
                        <Textarea
                            id={fieldId}
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder || 'Type your content here...'}
                            required={field.required}
                            className="border-0 focus-visible:ring-0 rounded-none resize-y min-h-[150px] p-4"
                        />
                    </div>
                );

            case 'image':
                return (
                    <div className={`space-y-3 p-4 border-2 border-dashed rounded-lg ${error ? 'border-destructive' : 'border-muted-foreground/25'} hover:bg-muted/50 transition-colors`}>
                        {value ? (
                            <div className="relative group rounded-md overflow-hidden bg-muted aspect-video flex items-center justify-center border">
                                <img src={value} alt="Preview" className="max-h-48 object-contain" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button type="button" variant="destructive" size="sm" onClick={() => onChange('')}>
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                    <ImageIcon className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-sm font-medium mb-1">Drag and drop or click to upload</p>
                                <p className="text-xs text-muted-foreground mb-4">Supports: JPG, PNG, WEBP</p>
                                <Input
                                    type="file"
                                    className="hidden"
                                    id={`${fieldId}-upload`}
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                onChange(reader.result);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`${fieldId}-upload`)?.click()}>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Select File
                                    </Button>
                                    {/* Fallback URL input toggle could go here */}
                                </div>
                            </div>
                        )}
                        <Input
                            placeholder="Or paste image URL..."
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            className="text-xs"
                        />
                    </div>
                );

            case 'toggle':
                return (
                    <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
                        <Switch
                            id={fieldId}
                            checked={!!value}
                            onCheckedChange={onChange}
                        />
                        <Label htmlFor={fieldId} className="cursor-pointer font-normal">
                            {value ? 'Active / Published' : 'Inactive / Draft'}
                        </Label>
                    </div>
                );

            // ... Existing cases need to stay or be wrapped ...
            // Integrating existing logic below for cleaner replacement:

            case 'textarea':
                return (
                    <Textarea
                        id={fieldId}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className={error ? 'border-destructive' : ''}
                        rows={4}
                    />
                );

            case 'number':
                return (
                    <Input
                        id={fieldId}
                        type="number"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        min={field.validation?.min}
                        max={field.validation?.max}
                        className={error ? 'border-destructive' : ''}
                    />
                );

            case 'email':
                return (
                    <Input
                        id={fieldId}
                        type="email"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder || 'example@email.com'}
                        required={field.required}
                        className={error ? 'border-destructive' : ''}
                    />
                );

            case 'url':
                return (
                    <Input
                        id={fieldId}
                        type="url"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder || 'https://example.com'}
                        required={field.required}
                        className={error ? 'border-destructive' : ''}
                    />
                );

            case 'date':
                return (
                    <Input
                        id={fieldId}
                        type="date"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        required={field.required}
                        className={error ? 'border-destructive' : ''}
                    />
                );

            case 'select':
                return (
                    <Select value={value || ''} onValueChange={onChange} required={field.required}>
                        <SelectTrigger className={error ? 'border-destructive' : ''}>
                            <SelectValue placeholder={field.placeholder || `Select ${label}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case 'checkbox':
                return (
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={fieldId}
                            checked={value || false}
                            onCheckedChange={onChange}
                        />
                        <label
                            htmlFor={fieldId}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {field.placeholder || label}
                        </label>
                    </div>
                );

            case 'text':
            default:
                return (
                    <Input
                        id={fieldId}
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        minLength={field.validation?.minLength}
                        maxLength={field.validation?.maxLength}
                        pattern={field.validation?.pattern}
                        className={error ? 'border-destructive' : ''}
                    />
                );
        }
    };

    return (
        <div className={`space-y-2 ${field.gridWidth === 2 ? 'col-span-2' : ''}`}>
            {field.type !== 'checkbox' && field.type !== 'toggle' && (
                <Label htmlFor={fieldId} className="flex items-center gap-1 font-semibold text-foreground/80">
                    {label}
                    {field.required && <span className="text-destructive">*</span>}
                </Label>
            )}
            {field.type === 'toggle' && (
                <div className="flex items-center gap-1 font-semibold text-foreground/80 mb-1">
                    {label}
                </div>
            )}
            {renderInput()}
            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
            {field.validation?.message && !error && (
                <p className="text-xs text-muted-foreground">{field.validation.message}</p>
            )}
        </div>
    );
};
