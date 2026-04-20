
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, ExternalLink, Globe, Calendar } from 'lucide-react';

interface ContentDetailProps {
    data: any;
    schema: any;
}

export const ContentDetail: React.FC<ContentDetailProps> = ({ data = {}, schema }) => {
    // Helper to get value case-insensitively
    const getValue = (obj: any, key: string) => {
        if (!obj) return undefined;
        // Try exact match first
        if (obj[key] !== undefined) return obj[key];
        // Try lowercase
        if (obj[key.toLowerCase()] !== undefined) return obj[key.toLowerCase()];
        // Try uppercase
        if (obj[key.toUpperCase()] !== undefined) return obj[key.toUpperCase()];
        // Try capitalized
        const cap = key.charAt(0).toUpperCase() + key.slice(1);
        if (obj[cap] !== undefined) return obj[cap];

        // Search keys
        const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
        return foundKey ? obj[foundKey] : undefined;
    };

    // Render different field types appropriately
    const renderField = (key: string, value: any) => {
        if (value === undefined || value === null || value === '') return null;

        // Find field definition case-insensitively
        const field = schema?.fields?.find((f: any) => f.name.toLowerCase() === key.toLowerCase());
        const fieldType = field?.type || 'text';

        // ... exact same rendering logic as before ...
        if (fieldType === 'rich-text') {
            return (
                <div
                    className="prose max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: value }}
                />
            );
        }

        if (fieldType === 'image') {
            return (
                <img
                    src={value}
                    alt={key}
                    className="max-w-full rounded-lg shadow-md"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
            );
        }

        if (fieldType === 'url') {
            return (
                <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2"
                >
                    <Globe className="h-4 w-4" />
                    {value}
                    <ExternalLink className="h-3 w-3" />
                </a>
            );
        }

        if (fieldType === 'email') {
            return (
                <a
                    href={`mailto:${value}`}
                    className="text-primary hover:underline flex items-center gap-2"
                >
                    <Mail className="h-4 w-4" />
                    {value}
                </a>
            );
        }

        if (fieldType === 'date') {
            return (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(value).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
            );
        }

        if (fieldType === 'toggle' || fieldType === 'checkbox') {
            return value ? <Badge className="bg-green-500">Yes</Badge> : <Badge variant="secondary">No</Badge>;
        }

        if (fieldType === 'textarea' || fieldType === 'text') {
            return <p className="text-lg leading-relaxed whitespace-pre-wrap">{value}</p>;
        }

        return <span>{String(value)}</span>;
    };

    // Extract common fields using case-insensitive lookup
    const title = getValue(data, 'Title') || getValue(data, 'title');
    const subtitle = getValue(data, 'Subtitle') || getValue(data, 'subtitle');
    const content = getValue(data, 'Content') || getValue(data, 'content') || getValue(data, 'Description') || getValue(data, 'description');
    const image = getValue(data, 'Image') || getValue(data, 'image') || getValue(data, 'Banner_Image') || getValue(data, 'Featured_Image');
    const featured = getValue(data, 'Featured') || getValue(data, 'featured');
    const status = getValue(data, 'Status') || getValue(data, 'status');
    const date = getValue(data, 'Date') || getValue(data, 'date') || getValue(data, 'Founded_Year');
    const gallery = getValue(data, 'Gallery') || getValue(data, 'gallery');

    return (
        <Card className="shadow-2xl border-0 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardContent className="p-6 md:p-10 lg:p-12">
                {/* Title */}
                {title && (
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 text-foreground leading-tight">
                        {title}
                    </h1>
                )}

                {/* Subtitle */}
                {subtitle && (
                    <h2 className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">
                        {subtitle}
                    </h2>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {featured && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1">
                            ⭐ Featured
                        </Badge>
                    )}
                    {status && <Badge variant="outline" className="px-3 py-1">{status}</Badge>}
                    {date && (
                        <Badge variant="secondary" className="px-3 py-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Badge>
                    )}
                </div>

                <Separator className="my-6" />

                {/* Main Image */}
                {image && (
                    <div className="mb-6">
                        <img
                            src={image}
                            alt={title || 'Image'}
                            className="w-full rounded-lg shadow-lg"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                )}

                {/* Main Content */}
                {content ? (
                    <div className="mb-8">
                        {/* Force rich-text rendering if the field name implies it or if value looks like HTML */}
                        {/<[a-z][\s\S]*>/i.test(content) || (schema?.fields?.find((f: any) => f.name === 'Content')?.type === 'rich-text')
                            ? <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: content }} />
                            : <p className="text-lg leading-relaxed whitespace-pre-wrap">{content}</p>
                        }
                    </div>
                ) : (
                    <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed text-center text-muted-foreground">
                        <p>No main content available.</p>
                        <p className="text-xs opacity-70 mt-1">(Field 'Content' is empty)</p>
                    </div>
                )}

                {/* Other Fields */}
                <div className="space-y-6">
                    {Object.entries(data || {}).map(([key, value]) => {
                        const lowerKey = key.toLowerCase();
                        // Skip already rendered fields (case-insensitive check)
                        if (['title', 'subtitle', 'content', 'description', 'image', 'banner_image', 'featured_image', 'featured', 'status', 'published', 'id', 'created_at', 'updated_at', 'gallery'].includes(lowerKey)) {
                            return null;
                        }

                        return (
                            <div key={key}>
                                <h3 className="font-semibold text-lg mb-2 text-foreground">
                                    {key.replace(/_/g, ' ')}
                                </h3>
                                <div className="text-muted-foreground">
                                    {renderField(key, value)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Gallery */}
                {gallery && (
                    <div className="mt-8">
                        <h3 className="font-semibold text-lg mb-4">Gallery</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {renderField('Gallery', gallery)}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
