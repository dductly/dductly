// /Users/andreapinto/Documents/dductly/frontend/src/contexts/AuthContext.tsx
import React, { createContext, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, businessName?: string, productsSold?: string, farmersMarkets?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (firstName: string, lastName: string, email: string, businessName?: string, productsSold?: string) => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export context for use in hooks file
export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Listen for auth changes
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        });
        
        subscription = data.subscription;
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, businessName?: string, productsSold?: string, farmersMarkets?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            business_name: businessName || '',
            products_sold: productsSold || '',
            farmers_markets: farmersMarkets || '',
          },
        },
      });
      return { error };
    } catch (err) {
      console.error('Sign up error:', err);
      return { 
        error: { 
          message: 'Unable to connect to authentication service. Please check your network connection or try again later.',
          name: 'ConnectionError',
          status: 500
        } as AuthError 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (err) {
      console.error('Sign in error:', err);
      return { 
        error: { 
          message: 'Unable to connect to authentication service. Please check your network connection or try again later.',
          name: 'ConnectionError',
          status: 500
        } as AuthError 
      };
    }
  };

  const updateProfile = async (firstName: string, lastName: string, email: string, businessName?: string, productsSold?: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        email,
        data: {
          first_name: firstName,
          last_name: lastName,
          business_name: businessName || '',
          products_sold: productsSold || '',
        },
      }, {
        emailRedirectTo: window.location.origin
      });
      return { error };
    } catch (err) {
      console.error('Update profile error:', err);
      return {
        error: {
          message: 'Unable to update profile. Please try again later.',
          name: 'UpdateError',
          status: 500
        } as AuthError
      };
    }
  };

  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};