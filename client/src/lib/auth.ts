import { createContext, useContext } from 'react';

// Simple user type
export interface User {
  id: number;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
}

// Dummy user for development
export const dummyUser: User = {
  id: 1,
  username: "admin",
  role: "admin",
  firstName: "Admin",
  lastName: "User",
  email: "admin@example.com",
  department: "Management"
};

// Auth state type
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

// Auth context type
export interface AuthContextType {
  authState: AuthState;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Create the context with dummy implementation
const AuthContext = createContext<AuthContextType>({
  authState: {
    isAuthenticated: true,
    user: dummyUser,
    loading: false
  },
  login: async () => {
    console.log("Mock login successful");
    return true;
  },
  logout: () => {
    console.log("Mock logout");
  }
});

// Simple authentication utilities
export const isAuthenticated = (): boolean => {
  return true; // Always authenticated in development
};

export const getCurrentUser = (): User => {
  return dummyUser;
};

// Mock auth provider - just a placeholder since we removed it from App.tsx
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return children;
};

// Add the useAuth hook to fix errors
export const useAuth = () => {
  return useContext(AuthContext);
};