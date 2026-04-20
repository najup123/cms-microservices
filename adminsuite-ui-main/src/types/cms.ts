export interface CmsField {
    name: string;
    type: 'text' | 'textarea' | 'rich-text' | 'number' | 'email' | 'url' | 'date' | 'select' | 'checkbox' | 'toggle' | 'image' | 'file';
    label?: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];  // For select
    gridWidth?: 1 | 2;   // 1 = Half width, 2 = Full width (default)
    defaultValue?: any;
    validation?: {
        pattern?: string;
        min?: number;
        max?: number;
        minLength?: number;
        maxLength?: number;
        message?: string;
    };
}

export interface CmsSchema {
    id?: number;
    moduleCode: string;
    displayName: string;
    fields: CmsField[];
}

export interface CmsContent {
    id: number;
    moduleCode: string;
    data: Record<string, any>;
    isPublished: boolean;
    createdAt?: string;
    updatedAt?: string;
}
