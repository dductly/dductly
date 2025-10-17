// Mock Authentication Context for testing without Supabase
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

interface AuthError {
  message: string;
  name: string;
  status: number;
}

interface AuthContextType {
  user: User | null;
  session: { user: User } | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock storage key
const MOCK_USER_KEY = 'mock_auth_user';
const MOCK_USERS_KEY = 'mock_auth_users';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ user: User } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem(MOCK_USER_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setSession({ user: parsedUser });
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get existing users
    const usersJson = localStorage.getItem(MOCK_USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : {};

    // Check if user already exists
    if (users[email]) {
      return {
        error: {
          message: 'User already registered',
          name: 'AuthError',
          status: 400
        }
      };
    }

    // Create new user
    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      email,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      }
    };

    // Store user
    users[email] = { ...newUser, password }; // In real app, never store password like this!
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(newUser));

    setUser(newUser);
    setSession({ user: newUser });

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get existing users
    const usersJson = localStorage.getItem(MOCK_USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : {};

    const userData = users[email];

    if (!userData || userData.password !== password) {
      return {
        error: {
          message: 'Invalid login credentials',
          name: 'AuthError',
          status: 400
        }
      };
    }

    // Create user object without password
    const loggedInUser: User = {
      id: userData.id,
      email: userData.email,
      user_metadata: userData.user_metadata
    };

    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setSession({ user: loggedInUser });

    return { error: null };
  };

  const signOut = async () => {
    localStorage.removeItem(MOCK_USER_KEY);
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthFromContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

