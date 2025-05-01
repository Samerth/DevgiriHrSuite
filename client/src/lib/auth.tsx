import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { setTokenProvider } from './queryClient'

// Extended user type to include our custom fields
export interface ExtendedUser extends User {
  firstName?: string;
  lastName?: string;
  role?: string;
  department?: string;
  employeeId?: string;
}

// Auth state type
export interface AuthState {
  isAuthenticated: boolean;
  user: ExtendedUser | null;
  session: Session | null;
}

// Auth context type
export interface AuthContextType {
  authState: AuthState;
  logout: () => Promise<void>;
  getSessionToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Simple authentication utilities
export const isAuthenticated = (): boolean => {
  const savedAuth = sessionStorage.getItem('authState');
  if (savedAuth) {
    const parsed = JSON.parse(savedAuth);
    return parsed.isAuthenticated && !!parsed.user;
  }
  return false;
};

export const getCurrentUser = (): ExtendedUser | null => {
  const savedAuth = sessionStorage.getItem('authState');
  if (savedAuth) {
    const parsed = JSON.parse(savedAuth);
    return parsed.user;
  }
  return null;
};

// Mock auth provider - just a placeholder since we removed it from App.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    session: null
  });

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        if (session) {
          setAuthState({
            isAuthenticated: true,
            user: session.user as ExtendedUser,
            session
          });
          setTokenProvider(() => session.access_token);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initializeSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setAuthState({
            isAuthenticated: true,
            user: session.user as ExtendedUser,
            session
          });
          setTokenProvider(() => session.access_token);
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            isAuthenticated: false,
            user: null,
            session: null
          });
          setTokenProvider(() => null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        session: null
      });
      setTokenProvider(() => null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getSessionToken = () => {
    return authState.session?.access_token || null;
  };

  return (
    <AuthContext.Provider value={{ authState, logout, getSessionToken }}>
      {children}
    </AuthContext.Provider>
  );
}

// Add the useAuth hook to fix errors
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}