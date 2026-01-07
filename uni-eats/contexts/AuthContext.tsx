import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/config/firebase';

// User type for the app
export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Map Firebase User to App User
 */
const mapFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  name: firebaseUser.displayName || 'User',
});

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(mapFirebaseUser(firebaseUser));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
    // User state will be updated by onAuthStateChanged listener
  };

  /**
   * Sign up with name, email, and password
   */
  const signUp = async (name: string, email: string, password: string): Promise<void> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(result.user, { displayName: name });
    
    // Update local user state with the name
    setUser({
      id: result.user.uid,
      email: result.user.email || '',
      name: name,
    });
  };

  /**
   * Sign out the current user
   */
  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
    // User state will be updated by onAuthStateChanged listener
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
