import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Shield, Boxes, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi, rolesApi, modulesApi, cmsApi } from '@/lib/api';
import { mockUsers, mockRoles, mockModules } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description, isLoading }) => (
  <Card className="bg-card border-border">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </CardContent>
  </Card>
);

export const Dashboard: React.FC = () => {
  const { user, isAdmin, isSuperAdmin, hasModuleManagePermission, hasModuleViewPermission } = useAuth();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        return await usersApi.getAll();
      } catch {
        return mockUsers;
      }
    },
    enabled: isAdmin,
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      try {
        return await rolesApi.getAll();
      } catch {
        return mockRoles;
      }
    },
    enabled: isAdmin,
  });

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      try {
        return await modulesApi.getAll();
      } catch {
        return mockModules;
      }
    },
    enabled: isSuperAdmin,
  });

  // Get user's first accessible module for CMS stats
  const userFirstModule = user?.roles?.flatMap(role =>
    (role.modules && Array.isArray(role.modules))
      ? role.modules.map((m: any) => m.moduleCode).filter(Boolean)
      : []
  ).filter((code, index, self) => self.indexOf(code) === index)[0];

  const { data: cmsContent, isLoading: cmsLoading } = useQuery({
    queryKey: ['cms-content', userFirstModule],
    queryFn: async () => {
      try {
        if (!userFirstModule) return [];
        return await cmsApi.getContent(userFirstModule);
      } catch {
        return [];
      }
    },
    enabled: !!userFirstModule,
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome back, ${user?.username || 'User'}`}
        description="Here's an overview of your RBAC system"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {isAdmin && (
          <>
            <StatCard
              title="Total Users"
              value={users?.length ?? 0}
              icon={Users}
              description="Active system users"
              isLoading={usersLoading}
            />
            <StatCard
              title="Roles"
              value={roles?.length ?? 0}
              icon={Shield}
              description="Defined roles"
              isLoading={rolesLoading}
            />
          </>
        )}
        {isSuperAdmin && (
          <StatCard
            title="Modules"
            value={modules?.length ?? 0}
            icon={Boxes}
            description="System modules"
            isLoading={modulesLoading}
          />
        )}
        <StatCard
          title="Your Roles"
          value={user?.roles?.length ?? 0}
          icon={Activity}
          description="Assigned to you"
        />
        {userFirstModule && (
          <StatCard
            title="CMS Content"
            value={cmsContent?.length ?? 0}
            icon={Boxes}
            description={`${user?.roles?.flatMap(r => r.modules || []).find((m: any) => m.moduleCode === userFirstModule)?.moduleName || userFirstModule} Entries`}
            isLoading={cmsLoading}
          />
        )}
      </div>

      {/* My Programs Section */}
      <h2 className="text-xl font-semibold tracking-tight mb-4">My Programs</h2>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 mb-8">
        {user?.roles?.flatMap(role =>
          // Extract modules with code and name
          (role.modules && Array.isArray(role.modules))
            ? role.modules.map((m: any) => ({
              code: m.moduleCode,
              name: m.moduleName || m.moduleCode
            }))
            : []
        ).filter((m, index, self) =>
          // Unique by code and truthy
          m.code && self.findIndex(x => x.code === m.code) === index
        ).map((module: any) => {
          const canManage = hasModuleManagePermission(module.code);
          const canView = hasModuleViewPermission(module.code);
          const linkTo = canManage ? `/cms/${module.code}` : `/view/${module.code}`;
          const actionText = canManage ? 'Manage content' : 'View content';

          return (
            <Link
              key={module.code}
              to={linkTo}
              className="block group"
            >
              <Card className="bg-card border-border hover:border-primary/50 transition-all duration-200 h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Program</CardTitle>
                  <Boxes className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{module.name}</div>
                  <p className="text-xs text-muted-foreground mt-1">{actionText}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {(!user?.roles?.some(r => r.modules?.length)) && (
          <div className="col-span-full p-8 text-center border dashed border-border rounded-lg text-muted-foreground">
            No programs assigned to your roles.
          </div>
        )}
      </div>

      {/* User Info Card */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">{user?.username}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Roles</p>
              <div className="flex flex-wrap gap-2">
                {user?.roles?.map((role) => (
                  <span
                    key={role.id}
                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary"
                  >
                    {role.name.replace('ROLE_', '')}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {isAdmin && (
                <>
                  <Link
                    to="/users"
                    className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <Users className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm font-medium">Manage Users</p>
                  </Link>
                  <Link
                    to="/roles"
                    className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <Shield className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm font-medium">Manage Roles</p>
                  </Link>
                </>
              )}
              {isSuperAdmin && (
                <Link
                  to="/modules"
                  className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <Boxes className="w-5 h-5 text-primary mb-2" />
                  <p className="text-sm font-medium">Manage Modules</p>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
