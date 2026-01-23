import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";

interface EmailConfirmationProps {
  onNavigate: (page: string) => void;
}

const EmailConfirmation: React.FC<EmailConfirmationProps> = ({ onNavigate }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshSession } = useAuth();

  useEffect(() => {
    // Check if we have confirmation tokens in the URL (hash fragment or query params)
    const handleEmailConfirmation = async () => {
      try {
        // Check for hash fragments (SPA mode - Supabase's default)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        const errorDescription = hashParams.get('error_description');

        // Check for query parameters (alternative format)
        const queryParams = new URLSearchParams(window.location.search);
        const queryToken = queryParams.get('token');
        const queryType = queryParams.get('type');
        const queryEmail = queryParams.get('email');

        // If there's an error in the hash, show it
        if (errorDescription) {
          setError(errorDescription);
          setIsVerifying(false);
          // Clean up the URL
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }

        // If we have tokens, process the confirmation
        if ((accessToken && type === 'email') || (queryToken && queryType === 'email')) {
          setIsVerifying(true);
          setError(null);

          // Supabase automatically handles the session from hash fragments when getSession() is called
          // For query parameters, we need to manually verify
          if (queryToken && queryEmail) {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token: queryToken,
              type: 'email',
              email: queryEmail,
            });

            if (verifyError) {
              setError(verifyError.message);
              setIsVerifying(false);
              // Clean up the URL
              window.history.replaceState({}, '', window.location.pathname);
              return;
            }
          }

          // Wait a moment for Supabase to process the session (especially for hash fragments)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh the session to get the updated user
          await refreshSession();
          
          // Check if user is now verified
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email_confirmed_at) {
            setIsVerified(true);
            // Clean up the URL
            window.history.replaceState({}, '', window.location.pathname);
          } else {
            setError('Email verification failed. The link may have expired. Please request a new confirmation email.');
          }
          
          setIsVerifying(false);
        } else if (user?.email_confirmed_at) {
          // User is already verified (maybe they refreshed the page)
          setIsVerified(true);
        }
      } catch (err) {
        console.error('Error verifying email:', err);
        setError('An error occurred while verifying your email. Please try again.');
        setIsVerifying(false);
      }
    };

    handleEmailConfirmation();
  }, [user, refreshSession]);

  // If user is verified, show success
  if (isVerified || user?.email_confirmed_at) {
    return (
      <div className="page">
        <section className="section">
          <div className="confirmation-container">
            <div className="confirmation-content success">
              <div className="success-icon">✓</div>
              <h1 className="section-title">Email Verified!</h1>
              <p>Your email has been successfully verified. You can now access all features of dductly.</p>
              <button 
                className="btn btn-primary"
                onClick={() => onNavigate('home')}
              >
                Get Started
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Show verifying state
  if (isVerifying) {
    return (
      <div className="page">
        <section className="section">
          <div className="confirmation-container">
            <div className="confirmation-content">
              <div className="email-icon">📧</div>
              <h1 className="section-title">Verifying Your Email</h1>
              <p>Please wait while we verify your email address...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="page">
        <section className="section">
          <div className="confirmation-container">
            <div className="confirmation-content">
              <div className="email-icon">⚠️</div>
              <h1 className="section-title">Verification Error</h1>
              <p>{error}</p>
              <div className="confirmation-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setError(null);
                    window.location.reload();
                  }}
                >
                  Try Again
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => onNavigate('home')}
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // If no tokens and not verified, redirect to home
  useEffect(() => {
    if (!isVerifying && !isVerified && !user?.email_confirmed_at && !error) {
      // Small delay to avoid flash, then redirect
      const timer = setTimeout(() => {
        onNavigate('home');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVerifying, isVerified, user, error, onNavigate]);

  // Show verifying state or nothing (will redirect)
  return (
    <div className="page">
      <section className="section">
        <div className="confirmation-container">
          <div className="confirmation-content">
            {isVerifying ? (
              <>
                <div className="email-icon">📧</div>
                <h1 className="section-title">Verifying Your Email</h1>
                <p>Please wait while we verify your email address...</p>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p>Redirecting...</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default EmailConfirmation;