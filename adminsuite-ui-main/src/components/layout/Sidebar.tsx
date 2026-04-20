import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  Boxes,
  LogOut,
  ChevronLeft,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { FileText } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Users',
    href: '/users',
    icon: Users,
    roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']
  },
  {
    label: 'Roles',
    href: '/roles',
    icon: Shield,
    roles: ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']
  },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(role => hasRole(role));
  });

  // Extract unique module names from user roles
  const moduleCodes = Array.from(new Set(
    user?.roles?.flatMap(role =>
      role.modules?.map((m: any) => m.moduleName) || []
    ).filter(Boolean)
  ));

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-primary-foreground text-xs">University of Jan Dai</span>
              <span className="text-[10px] text-muted-foreground">CMS Admin</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:text-sidebar-primary-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "text-sidebar-foreground hover:text-sidebar-primary-foreground hover:bg-sidebar-accent",
                isActive && "bg-sidebar-accent text-sidebar-primary-foreground font-medium"
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {/* Dynamic Modules Section */}
        {moduleCodes.length > 0 && !collapsed && (
          <div className="px-3 mt-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Modules
          </div>
        )}
        {moduleCodes.map((code: any) => (
          <NavLink
            key={code}
            to={`/cms/${code}`}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "text-sidebar-foreground hover:text-sidebar-primary-foreground hover:bg-sidebar-accent",
                isActive && "bg-sidebar-accent text-sidebar-primary-foreground font-medium"
              )
            }
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{code}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="mb-3 px-3 py-2">
            <p className="text-sm font-medium text-sidebar-primary-foreground truncate">
              {user.username}
            </p>
            <p className="text-xs text-sidebar-foreground truncate">
              {user.email}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {user.roles?.slice(0, 2).map((role) => (
                <span
                  key={role.name}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary"
                >
                  {role.name.replace('ROLE_', '')}
                </span>
              ))}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full text-sidebar-foreground hover:text-destructive hover:bg-destructive/10",
            collapsed ? "justify-center px-0" : "justify-start"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </aside>
  );
};
