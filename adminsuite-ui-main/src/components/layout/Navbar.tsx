import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
    LogOut,
    Menu,
    X,
    User,
    GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Navbar: React.FC = () => {
    //Extract modules from user roles
    const { user, logout, hasModuleManagePermission, hasModuleViewPermission } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Extract modules from user roles
    const userModules = user?.roles?.flatMap(role => {
        if (role.modules && Array.isArray(role.modules)) {
            return role.modules.map((m: any) => ({
                code: m.moduleCode,
                name: m.moduleName || m.moduleCode
            }));
        }
        return [];
    }).filter((m, index, self) =>
        m.code && self.findIndex(x => x.code === m.code) === index
    ) || [];

    // Categorize modules by permission
    const manageModules = userModules.filter(m => hasModuleManagePermission(m.code));
    const viewModules = userModules.filter(m => !hasModuleManagePermission(m.code) && hasModuleViewPermission(m.code));

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-primary shadow-md">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">

                {/* Logo Section */}
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-full shadow-sm">
                        <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex flex-col text-white">
                        <span className="text-xl font-bold leading-tight tracking-wide">UNIVERSITY OF</span>
                        <span className="text-xs font-light tracking-[0.2em] uppercase">JanDai</span>
                    </div>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    {/* HOME Link */}
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            cn(
                                "text-white text-sm font-semibold hover:text-accent transition-colors py-2",
                                isActive && "border-b-2 border-accent text-accent"
                            )
                        }
                    >
                        HOME
                    </NavLink>

                    {/* Dynamic CMS Management Links (for users with manage permissions) */}
                    {manageModules.map((module: any) => (
                        <NavLink
                            key={`cms-${module.code}`}
                            to={`/cms/${module.code}`}
                            className={({ isActive }) =>
                                cn(
                                    "text-white text-sm font-semibold hover:text-accent transition-colors py-2",
                                    isActive && "border-b-2 border-accent text-accent"
                                )
                            }
                        >
                            {module.name.toUpperCase()}
                        </NavLink>
                    ))}

                    {/* Dynamic View Links (for users with view-only permissions) */}
                    {viewModules.map((module: any) => (
                        <NavLink
                            key={`view-${module.code}`}
                            to={`/view/${module.code}`}
                            className={({ isActive }) =>
                                cn(
                                    "text-white text-sm font-semibold hover:text-accent transition-colors py-2",
                                    isActive && "border-b-2 border-accent text-accent"
                                )
                            }
                        >
                            {module.name.toUpperCase()}
                        </NavLink>
                    ))}

                    {/* User Profile Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="text-white hover:bg-primary-foreground/10 hover:text-accent ml-4 flex gap-2">
                                <User className="h-5 w-5" />
                                <span className="hidden lg:inline">{user?.username}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white">
                            <div className="flex items-center justify-start gap-2 p-2">
                                <div className="flex flex-col space-y-1 leading-none">
                                    <p className="font-medium">{user?.username}</p>
                                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                                </div>
                            </div>
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </nav>

                {/* Mobile Menu Toggle */}
                <Button
                    variant="ghost"
                    className="md:hidden text-white hover:bg-white/10"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </div>

            {/* Mobile Navigation Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-primary border-t border-white/10 p-4 absolute w-full shadow-xl">
                    <div className="flex flex-col gap-4">
                        {/* HOME Link */}
                        <NavLink
                            to="/dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-white font-medium hover:text-accent"
                        >
                            HOME
                        </NavLink>

                        {/* Module Links */}
                        {manageModules.length > 0 && (
                            <div className="py-2 border-t border-white/10">
                                <span className="text-accent text-xs font-bold uppercase tracking-wider mb-2 block">Manage Modules</span>
                                <div className="flex flex-col gap-2 pl-4">
                                    {manageModules.map((module: any) => (
                                        <NavLink
                                            key={`mobile-cms-${module.code}`}
                                            to={`/cms/${module.code}`}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-white/90 hover:text-white"
                                        >
                                            {module.name}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* View-only Module Links */}
                        {viewModules.length > 0 && (
                            <div className="py-2 border-t border-white/10">
                                <span className="text-accent text-xs font-bold uppercase tracking-wider mb-2 block">View Content</span>
                                <div className="flex flex-col gap-2 pl-4">
                                    {viewModules.map((module: any) => (
                                        <NavLink
                                            key={`mobile-view-${module.code}`}
                                            to={`/view/${module.code}`}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-white/90 hover:text-white"
                                        >
                                            {module.name}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button
                            variant="secondary"
                            onClick={handleLogout}
                            className="w-full mt-4 bg-white text-primary hover:bg-accent hover:text-white"
                        >
                            Log out
                        </Button>
                    </div>
                </div>
            )}
        </header>
    );
};
