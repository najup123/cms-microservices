import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import UserList from "@/pages/users/UserList";
import UserForm from "@/pages/users/UserForm";
import RoleList from "@/pages/roles/RoleList";
import RoleForm from "@/pages/roles/RoleForm";
import ModuleList from "@/pages/modules/ModuleList";
import ModuleForm from "@/pages/modules/ModuleForm";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import GenericModulePage from "@/pages/cms/GenericModulePage";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import PublicContentView from "@/pages/public/PublicContentView";
import PublicContentDetail from "@/pages/public/PublicContentDetail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Public CMS Content Viewing - No authentication required */}
            <Route path="/public/:moduleCode" element={<PublicContentView />} />
            <Route path="/public/:moduleCode/:id" element={<PublicContentDetail />} />

            {/* Protected routes with layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />

              {/* User management - Admin only */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
                    <UserList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/new"
                element={
                  <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
                    <UserForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:id/edit"
                element={
                  <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
                    <UserForm />
                  </ProtectedRoute>
                }
              />

              {/* Role management - Admin only */}
              <Route
                path="/roles"
                element={
                  <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
                    <RoleList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roles/new"
                element={
                  <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
                    <RoleForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roles/:id/edit"
                element={
                  <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
                    <RoleForm />
                  </ProtectedRoute>
                }
              />

              {/* Module management - Super Admin only */}
              <Route
                path="/modules"
                element={
                  <ProtectedRoute requiredRoles={['ROLE_SUPER_ADMIN']}>
                    <ModuleList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/modules/new"
                element={
                  <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
                    <ModuleForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/modules/:id/edit"
                element={
                  <ProtectedRoute requiredRoles={['ROLE_SUPER_ADMIN']}>
                    <ModuleForm />
                  </ProtectedRoute>
                }
              />

              {/* Settings - All authenticated users */}
              <Route path="/settings" element={<Settings />} />

              {/* Dynamic CMS Modules */}
              <Route path="/cms/:moduleCode" element={<GenericModulePage />} />

              {/* Public Content Viewing - for users with SELECT permission */}
              <Route path="/view/:moduleCode" element={<PublicContentView />} />
              <Route path="/view/:moduleCode/:id" element={<PublicContentDetail />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
