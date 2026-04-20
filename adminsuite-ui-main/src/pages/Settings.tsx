import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

export const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Settings"
        description="View your account settings and system information"
      />

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
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
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-medium">{user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assigned Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user?.roles?.map((role) => (
                <Badge key={role.id} variant="secondary" className="px-3 py-1">
                  {role.name || 'Unknown Role'}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">API Endpoint</span>
              <code className="px-2 py-0.5 rounded bg-muted font-mono text-xs">
                http://localhost:9090
              </code>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Frontend Version</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Authentication</span>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                JWT Bearer
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
