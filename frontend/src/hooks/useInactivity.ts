import { useContext } from 'react';
import { InactivityContext } from '../contexts/InactivityContext';

export const useInactivity = () => {
  const context = useContext(InactivityContext);
  if (context === undefined) {
    throw new Error('useInactivity must be used within an InactivityProvider');
  }
  return context;
};
