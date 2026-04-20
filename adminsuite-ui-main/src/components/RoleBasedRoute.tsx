import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RoleBasedRouteProps {
    allowedRoles: string[];
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ allowedRoles }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has at least one of the allowed roles
    const hasPermission = user.roles.some(role =>
        allowedRoles.includes(role.name) ||
        allowedRoles.includes(role.name.replace('ROLE_', ''))
    );

    if (!hasPermission) {
        // Redirect to dashboard (or specific error page) if not authorized
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
