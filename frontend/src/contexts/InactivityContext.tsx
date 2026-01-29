/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';

interface InactivityContextType {
  showWarning: boolean;
  remainingSeconds: number;
  resetActivity: () => void;
  currentTimeoutMinutes: number;
}

const InactivityContext = createContext<InactivityContextType | undefined>(undefined);

export { InactivityContext };

// Default timeout options in minutes
export const TIMEOUT_OPTIONS = [5, 10, 15, 30, 60];
export const DEFAULT_TIMEOUT_MINUTES = 15;

export const InactivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();

  // Get user's preferred timeout or default to 15 minutes
  const userTimeoutMinutes = user?.user_metadata?.auto_logout_timeout ?? DEFAULT_TIMEOUT_MINUTES;

  // Timeout durations - use user preference in production, 30s in dev for testing
  const WARNING_TIME = useMemo(() =>
    import.meta.env.DEV ? 30 * 1000 : userTimeoutMinutes * 60 * 1000,
    [userTimeoutMinutes]
  );
  const COUNTDOWN_SECONDS = 120; // 2 minutes
  const DEBOUNCE_DELAY = 300; // 300ms debounce

  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(COUNTDOWN_SECONDS);

  const warningTimerRef = useRef<number | null>(null);
  const logoutTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // Start countdown when warning appears
  const startCountdown = useCallback(() => {
    setRemainingSeconds(COUNTDOWN_SECONDS);

    countdownIntervalRef.current = window.setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          // Countdown finished, logout user
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          signOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [signOut]);

  // Start warning timer
  const startWarningTimer = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);

    console.log(`[Inactivity] Starting warning timer for ${WARNING_TIME / 1000} seconds`);
    warningTimerRef.current = window.setTimeout(() => {
      console.log('[Inactivity] Warning time reached! Showing modal...');
      setShowWarning(true);
      startCountdown();
    }, WARNING_TIME);
  }, [WARNING_TIME, clearAllTimers, startCountdown]);

  // Reset activity (called on user interaction or "I'm Still Here" button)
  const resetActivity = useCallback(() => {
    console.log('[Inactivity] Activity detected, resetting timer');
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    startWarningTimer();
  }, [startWarningTimer]);

  // Debounced activity handler
  const handleActivity = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      if (!showWarning) {
        resetActivity();
      }
    }, DEBOUNCE_DELAY);
  }, [showWarning, resetActivity, DEBOUNCE_DELAY]);

  // Handle visibility change (pause/resume when tab hidden/visible)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Tab hidden - pause timers
      clearAllTimers();
    } else {
      // Tab visible - check elapsed time and resume
      const elapsedTime = Date.now() - lastActivityRef.current;
      const TOTAL_TIMEOUT = WARNING_TIME + (COUNTDOWN_SECONDS * 1000); // 15 min + 2 min

      if (elapsedTime >= TOTAL_TIMEOUT) {
        // 17+ minutes passed while away - log out immediately
        console.log('[Inactivity] 17+ minutes passed while away, logging out');
        signOut();
      } else if (elapsedTime >= WARNING_TIME) {
        // Between 15-17 minutes - show warning with remaining countdown
        const elapsedCountdownSeconds = Math.floor((elapsedTime - WARNING_TIME) / 1000);
        const remainingCountdown = COUNTDOWN_SECONDS - elapsedCountdownSeconds;
        setRemainingSeconds(remainingCountdown);
        setShowWarning(true);

        // Start countdown from remaining time
        countdownIntervalRef.current = window.setInterval(() => {
          setRemainingSeconds(prev => {
            if (prev <= 1) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
              }
              signOut();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // Resume warning timer with remaining time
        const remainingTime = WARNING_TIME - elapsedTime;
        warningTimerRef.current = window.setTimeout(() => {
          setShowWarning(true);
          startCountdown();
        }, remainingTime);
      }
    }
  }, [WARNING_TIME, COUNTDOWN_SECONDS, clearAllTimers, signOut, startCountdown]);

  // Initialize and cleanup
  useEffect(() => {
    // Only activate for authenticated users
    if (!user) {
      console.log('[Inactivity] User not authenticated, inactivity timer disabled');
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    console.log(`[Inactivity] User authenticated, initializing inactivity timer (${userTimeoutMinutes} minutes)`);
    // Start initial warning timer
    startWarningTimer();

    // Add activity event listeners
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearAllTimers();
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userTimeoutMinutes]); // Re-run when user changes or timeout preference changes

  const value = {
    showWarning,
    remainingSeconds,
    resetActivity,
    currentTimeoutMinutes: userTimeoutMinutes,
  };

  return <InactivityContext.Provider value={value}>{children}</InactivityContext.Provider>;
};
