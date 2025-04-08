import { createContext, useContext, useState, ReactNode } from 'react';

// Simplified auth context for demo purposes
interface AuthContextType {
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: true, // Always authenticated for demo
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // Simplified provider that always sets isAuthenticated to true
  return (
    <AuthContext.Provider value={{ isAuthenticated: true }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);