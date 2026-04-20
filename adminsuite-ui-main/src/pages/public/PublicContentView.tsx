import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Eye, Calendar, Search, ArrowLeft } from 'lucide-react';
import { cmsApi } from '@/lib/api';
import { useState } from 'react';
import { ContentDetail } from '@/components/cms/ContentDetail';

const PublicContentView: React.FC = () => {
    const { moduleCode } = useParams<{ moduleCode: string }>();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: schema, isLoading: isSchemaLoading } = useQuery({
        queryKey: ['public-schema', moduleCode],
        queryFn: () => cmsApi.getPublicSchema(moduleCode!),
        enabled: !!moduleCode,
    });

    const { data: content, isLoading: isContentLoading } = useQuery({
        queryKey: ['public-content', moduleCode],
        queryFn: () => cmsApi.getPublicContent(moduleCode!),
        enabled: !!moduleCode,
    });

    const publishedContent = content?.filter((item: any) => {
        const data = item.data || {};
        // Robust check for published status (handles booleans and strings)
        const isPublished = data.Published !== false &&
            data.published !== false &&
            String(data.Published).toLowerCase() !== 'false' &&
            String(data.published).toLowerCase() !== 'false';
        return isPublished;
    }) || [];

    const filteredContent = publishedContent.filter((item: any) => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return Object.values(item.data || {}).some(value =>
            String(value).toLowerCase().includes(searchLower)
        );
    });

    if (isSchemaLoading || isContentLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        );
    }

    const displayName = schema?.displayName || moduleCode;

    // Singleton Heuristic:
    // 1. If we have exactly one published item.
    // 2. OR if the module name implies a singleton (About, Contact, etc.) and we have at least one item.
    // 3. AND we are not searching.
    const isSingletonModule = ['about', 'contact', 'terms', 'privacy', 'policy', 'mission', 'vision'].some(keyword =>
        moduleCode.toLowerCase().includes(keyword) ||
        (displayName && displayName.toLowerCase().includes(keyword))
    );

    const showSingleView = !searchTerm && (
        publishedContent.length === 1 ||
        (publishedContent.length > 0 && isSingletonModule)
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <div className="bg-primary text-white shadow-lg">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-4">
                        <Link to="/login">
                            <Button variant="ghost" className="text-white hover:bg-white/10">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Admin Login
                            </Button>
                        </Link>
                        <Link to="/register">
                            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                                Sign Up
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-4xl font-bold mb-2">{displayName}</h1>
                    <p className="text-white/80">Browse and explore our {displayName?.toLowerCase()} content</p>
                </div>
            </div>

            {/* Search Bar - Hide if showing single view */}
            {!showSingleView && (
                <div className="container mx-auto px-4 py-6">
                    <div className="max-w-xl mx-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder={`Search ${displayName?.toLowerCase()}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 py-6 text-lg"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Content Display */}
            <div className="container mx-auto px-4 pb-12">
                {showSingleView ? (
                    // Single View Mode
                    <div className="max-w-4xl mx-auto mt-8">
                        <ContentDetail data={publishedContent[0].data} schema={schema} />
                    </div>
                ) : (
                    // List View Mode
                    <>
                        {filteredContent && filteredContent.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredContent.map((item: any) => {
                                    const data = item.data || {};
                                    const title = data.Title || data.title || 'Untitled';
                                    const description = data.Description || data.description || data.Subtitle || data.subtitle || '';
                                    const image = data.Image || data.image || data.Banner_Image || data['Featured Image'];
                                    const date = data.Date || data.date || data.Founded_Year;

                                    // Published check already done in publishedContent filter logic

                                    return (
                                        <Link key={item.id} to={`/view/${moduleCode}/${item.id}`} className="block h-full">
                                            <Card className="h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden group border-2 hover:border-primary/50">
                                                {image && (
                                                    <div className="overflow-hidden h-56 bg-gradient-to-br from-primary/10 to-primary/5 relative">
                                                        <img
                                                            src={image}
                                                            alt={title}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                        {data.Featured && (
                                                            <div className="absolute top-3 right-3">
                                                                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
                                                                    ⭐ Featured
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors text-xl leading-snug">
                                                        {title}
                                                    </CardTitle>
                                                    {description && (
                                                        <CardDescription className="line-clamp-2 text-base mt-2">
                                                            {description}
                                                        </CardDescription>
                                                    )}
                                                </CardHeader>
                                                <CardContent className="pt-0">
                                                    <div className="flex items-center justify-between mb-3">
                                                        {date && (
                                                            <div className="flex items-center text-sm text-muted-foreground">
                                                                <Calendar className="mr-1.5 h-4 w-4" />
                                                                <span className="font-medium">
                                                                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-white transition-all duration-300 font-medium">
                                                        <Eye className="mr-2 h-4 w-4" /> View Full Details
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <Eye className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-2xl font-semibold mb-2">No Content Found</h3>
                                <p className="text-muted-foreground">
                                    {searchTerm ? 'Try adjusting your search terms' : `No ${displayName?.toLowerCase()} content available yet`}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default PublicContentView;
