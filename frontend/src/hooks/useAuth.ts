// /Users/andreapinto/Documents/dductly/frontend/src/hooks/useAuth.ts
import { useContext } from 'react';
// Using MockAuthContext for testing without Supabase
// To switch to real Supabase, change import to: import { AuthContext } from '../contexts/AuthContext';
import { useAuthFromContext } from '../contexts/MockAuthContext';

export const useAuth = useAuthFromContext;

