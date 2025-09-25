import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

const EmailConfirmation: React.FC = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Check if user is already verified
    if (user?.email_confirmed_at) {
      setIsVerified(true);
      setIsLoading(false);
    } else {
      // Check verification status periodically
      const interval = setInterval(() => {
        if (user?.email_confirmed_at) {
          setIsVerified(true);
          setIsLoading(false);
          clearInterval(interval);
        }
      }, 2000);

      // Cleanup after 5 minutes
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setIsLoading(false);
      }, 300000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="page">
        <section className="section">
          <div className="confirmation-container">
            <div className="confirmation-content">
              <div className="loading-spinner"></div>
              <h1 className="section-title">Verifying Your Email</h1>
              <p>Please wait while we verify your email address...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="page">
        <section className="section">
          <div className="confirmation-container">
            <div className="confirmation-content success">
              <div className="success-icon">✓</div>
              <h1 className="section-title">Email Verified!</h1>
              <p>Your email has been successfully verified. You can now access all features of dductly.</p>
              <a href="#home" className="btn btn-primary">
                Get Started
              </a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="section">
        <div className="confirmation-container">
          <div className="confirmation-content">
            <div className="email-icon">📧</div>
            <h1 className="section-title">Check Your Email</h1>
            <p>
              We've sent a confirmation link to <strong>{user?.email}</strong>
            </p>
            <p>Please check your email and click the link to verify your account.</p>
            <div className="confirmation-actions">
              <button 
                className="btn btn-ghost" 
                onClick={() => window.location.reload()}
              >
                Check Again
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  // Resend confirmation email
                  // This would require adding a resend function to AuthContext
                }}
              >
                Resend Email
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EmailConfirmation;
