import { createContext, useContext, useState, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from './queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if user is authenticated
  const { isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    onSuccess: (data: any) => {
      if (data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    },
    onError: () => {
      setUser(null);
    },
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest('POST', '/api/auth/login', credentials);
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: 'Welcome back!',
        description: `You've successfully signed in as ${data.user.firstName} ${data.user.lastName}`,
      });
      setLocation('/dashboard');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Authentication failed',
        description: (error as Error).message || 'Invalid username or password',
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/auth/logout');
      return res.json();
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Logout failed',
        description: (error as Error).message || 'Failed to logout. Please try again.',
      });
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const contextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);