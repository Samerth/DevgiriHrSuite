import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Simple user type
export interface User {
  id: number;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  employeeId: string;
}

// Dummy user for development
export const dummyUser: User = {
  id: 1,
  username: "admin",
  role: "admin",
  firstName: "Admin",
  lastName: "User",
  email: "admin@example.com",
  department: "Management",
  employeeId: "EMP001"
};

// Auth state type
export interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department: string;
  } | null;
}

// Auth context type
export interface AuthContextType {
  authState: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  authState: {
    isAuthenticated: false,
    user: null,
  },
  login: async () => false,
  logout: async () => {},
});

// Simple authentication utilities
export const isAuthenticated = (): boolean => {
  const savedAuth = sessionStorage.getItem('authState');
  if (savedAuth) {
    const parsed = JSON.parse(savedAuth);
    return parsed.isAuthenticated && !!parsed.user;
  }
  return false;
};

export const getCurrentUser = (): User => {
  return dummyUser;
};

// Mock auth provider - just a placeholder since we removed it from App.tsx
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Initialize from sessionStorage if available
    const savedAuth = sessionStorage.getItem('authState');
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth);
      // Only restore if we have both isAuthenticated and user
      if (parsed.isAuthenticated && parsed.user) {
        return parsed;
      }
    }
    return {
      isAuthenticated: false,
      user: null,
    };
  });

  // Save auth state to sessionStorage whenever it changes
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      sessionStorage.setItem('authState', JSON.stringify(authState));
    } else {
      sessionStorage.removeItem('authState');
    }
  }, [authState]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // For development, use dummy user
      if (email === dummyUser.email) {
        setAuthState({
          isAuthenticated: true,
          user: {
            id: dummyUser.id,
            firstName: dummyUser.firstName || '',
            lastName: dummyUser.lastName || '',
            email: dummyUser.email || '',
            role: dummyUser.role,
            department: dummyUser.department || '',
          },
        });
        return true;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setAuthState({
          isAuthenticated: true,
          user: userData.user,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setAuthState({
        isAuthenticated: false,
        user: null,
      });
      sessionStorage.removeItem('authState');
    }
  };

  const value = {
    authState,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Add the useAuth hook to fix errors
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};