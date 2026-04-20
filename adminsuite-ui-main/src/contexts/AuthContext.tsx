import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { decodeJwt, usersApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roleName: string) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  refreshProfile: () => Promise<void>;
  hasModulePermission: (moduleCode: string, functionId: number) => boolean;
  hasModuleManagePermission: (moduleCode: string) => boolean;
  hasModuleViewPermission: (moduleCode: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      // Check if token is already expired on load
      if (isTokenExpired(storedToken)) {
        // Stored token is expired on load, clearing session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } else {
        setToken(storedToken);
        try {
          setUser(JSON.parse(storedUser));

          // Auto-refresh profile from server to get latest roles
          usersApi.getMe().then(userData => {
            console.log('Refreshed user profile from server');
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }).catch(err => {
            console.error('Failed to auto-refresh profile:', err);
            if (err.response?.status === 401) {
              // Token invalid, logout
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setToken(null);
              setUser(null);
            }
          });
        } catch {
          localStorage.removeItem('user');
        }
      }
    }
    setIsLoading(false);

    // Set up periodic token expiration check (every 30 seconds)
    const intervalId = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (currentToken && isTokenExpired(currentToken)) {
        // Token expired during session, logging out...
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // Helper to check token expiration safely
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded = decodeJwt(token);
      if (!decoded) return true; // Invalid token
      if (!decoded.exp) return false; // No expiration claim, assume valid

      const expirationTime = decoded.exp * 1000;
      const currentTime = Date.now();
      return currentTime >= expirationTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return false; // Fail safe, let backend handle it
    }
  };


  const login = async (newToken: string) => {
    // Store token first so API calls can use it
    localStorage.setItem('token', newToken);
    setToken(newToken);

    // Fetch full user data with modules from backend
    try {
      const userData = await usersApi.getMe();
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // Fallback to JWT decode if API fails
      const decoded = decodeJwt(newToken);
      if (!decoded) {
        console.error('Failed to decode JWT token');
        logout();
        return;
      }

      const user: User = {
        id: 0,
        username: decoded.sub,
        email: decoded.sub,
        roles: decoded.roles?.map((role: string, index: number) => ({ id: `jwt-${index}`, name: role })) || []
      };

      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (roleName: string): boolean => {
    return user?.roles?.some(role => role.name === roleName) ?? false;
  };

  const isAdmin = hasRole('ROLE_ADMIN') || hasRole('ROLE_SUPER_ADMIN');
  const isSuperAdmin = hasRole('ROLE_SUPER_ADMIN');

  const refreshProfile = async () => {
    try {
      const userData = await usersApi.getMe();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const hasModulePermission = (moduleCode: string, functionId: number): boolean => {
    if (!user?.roles) return false;
    if (isSuperAdmin) return true;

    return user.roles.some(role => {
      if (role.modules && Array.isArray(role.modules)) {
        return role.modules.some((m: any) =>
          (m.moduleCode === moduleCode || m.moduleName === moduleCode) &&
          m.functionIds?.includes(functionId)
        );
      }
      return false;
    });
  };

  const hasModuleManagePermission = (moduleCode: string): boolean => {
    // Has CREATE(1), UPDATE(3), or DELETE(4) permission
    return hasModulePermission(moduleCode, 1) ||
      hasModulePermission(moduleCode, 3) ||
      hasModulePermission(moduleCode, 4);
  };

  const hasModuleViewPermission = (moduleCode: string): boolean => {
    // Has SELECT(2) permission OR module is assigned to user's role
    if (hasModulePermission(moduleCode, 2)) return true;

    // If module is assigned to user, grant view access even without explicit SELECT permission
    if (!user?.roles) return false;
    return user.roles.some(role => {
      if (role.modules && Array.isArray(role.modules)) {
        return role.modules.some((m: any) =>
          m.moduleCode === moduleCode || m.moduleName === moduleCode
        );
      }
      return false;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        hasRole,
        isAdmin,
        isSuperAdmin,
        refreshProfile,
        hasModulePermission,
        hasModuleManagePermission,
        hasModuleViewPermission,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
