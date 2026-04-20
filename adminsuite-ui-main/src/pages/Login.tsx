import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, decodeJwt } from '@/lib/api';
import { mockUser, mockToken } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const loginMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await authApi.login(username, password);
        return response;
      } catch (error: any) {
        // Fallback for demo purposes if backend is down
        if (error.code === 'ERR_NETWORK') {
          console.warn('Backend unreachable, using mock');
          return { token: mockToken, user: mockUser };
        }
        throw error;
      }
    },
    onSuccess: async (data) => {
      // Backend now only returns { token: "..." }
      if (data.token) {
        await login(data.token); // Wait for user data to be fetched
        const decoded = decodeJwt(data.token);
        const username = decoded?.sub || 'User';
        toast({
          title: 'Welcome back!',
          description: `Logged in as ${username}`,
        });
        navigate(from, { replace: true });
      } else {
        toast({
          title: 'Login Error',
          description: 'Invalid response from server',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      // Backend RestAuthenticationFailureHandler returns { Message: "...", error: "..." }
      const serverMsg = error.response?.data?.Message || error.response?.data?.error || 'Invalid credentials';
      toast({
        title: 'Login failed',
        description: serverMsg,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter both username and password',
        variant: 'destructive',
      });
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

      <Card className="w-full max-w-md relative animate-fade-in border-border bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">University of Jan Dai</CardTitle>
          <CardDescription>CMS Login</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin@system.io"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-background"
                disabled={loginMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background"
                disabled={loginMutation.isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
        <div className="text-center pb-4">
          <p className="text-sm text-muted-foreground">
            Don't have an account? <a href="/register" className="text-primary hover:underline">Register</a>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;