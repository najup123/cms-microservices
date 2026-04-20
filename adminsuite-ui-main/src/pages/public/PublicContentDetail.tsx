import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Calendar, Mail, ExternalLink, Globe, Phone, MapPin, User, Clock, Tag, Home } from 'lucide-react';
import { cmsApi } from '@/lib/api';
import { ContentDetail } from '@/components/cms/ContentDetail';

const PublicContentDetail: React.FC = () => {
    const { moduleCode, id } = useParams<{ moduleCode: string; id: string }>();
    const navigate = useNavigate();

    const { data: schema, isLoading: isSchemaLoading } = useQuery({
        queryKey: ['public-schema', moduleCode],
        queryFn: () => cmsApi.getPublicSchema(moduleCode!),
        enabled: !!moduleCode,
    });

    const { data: content, isLoading: isContentLoading } = useQuery({
        queryKey: ['public-content', moduleCode, id],
        queryFn: () => cmsApi.getPublicContentById(moduleCode!, Number(id)),
        enabled: !!moduleCode && !!id,
    });

    if (isSchemaLoading || isContentLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="text-center">
                    <Loader2 className="animate-spin h-16 w-16 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">Loading content...</p>
                </div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="text-center space-y-4">
                    <div className="text-6xl mb-4">📄</div>
                    <h2 className="text-3xl font-bold">Content Not Found</h2>
                    <p className="text-muted-foreground max-w-md">The content you're looking for doesn't exist or has been removed.</p>
                    <Button size="lg" onClick={() => navigate(`/view/${moduleCode}`)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
                    </Button>
                </div>
            </div>
        );
    }

    const data = content.data || {};
    const displayName = schema?.displayName || moduleCode;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Sticky Header with Breadcrumb */}
            <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
                                <Home className="h-4 w-4" />
                                Home
                            </Link>
                            <span>/</span>
                            <Link to={`/view/${moduleCode}`} className="hover:text-primary transition-colors">
                                {displayName}
                            </Link>
                            <span>/</span>
                            <span className="text-foreground font-medium truncate max-w-[150px] md:max-w-[300px]">
                                {data.Title || 'Content'}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/view/${moduleCode}`)}
                            className="hover:bg-primary/10"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
                <ContentDetail data={data} schema={schema} />
            </div>
        </div>
    );
};

export default PublicContentDetail;
