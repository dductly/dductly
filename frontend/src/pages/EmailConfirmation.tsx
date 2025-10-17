import React, { useState } from "react";

interface EmailConfirmationProps {
  onNavigate: (page: string) => void;
}

const EmailConfirmation: React.FC<EmailConfirmationProps> = ({ onNavigate }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate email verification process
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsVerified(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

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

  return (
    <div className="page">
      <section className="section">
        <div className="confirmation-container">
          <div className="confirmation-content">
            <div className="email-icon">📧</div>
            <h1 className="section-title">Check Your Email</h1>
            <p>We've sent a confirmation link to your email address.</p>
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
                onClick={() => setIsVerified(true)}
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