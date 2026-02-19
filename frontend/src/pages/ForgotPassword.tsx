import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface ForgotPasswordProps {
  onNavigate: (page: string) => void;
  onSignInClick: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate, onSignInClick }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("Unable to send reset email. Please try again later.");
    }

    setLoading(false);
  };

  return (
    <div className="page">
      <section className="section">
        <div className="forgot-password-container">
          <h1 className="section-title">Reset Your Password</h1>
          <p className="forgot-password-subtitle">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {sent ? (
            <div className="forgot-password-card">
              <div className="success-banner">
                If an account exists with that email, a password reset link has been sent. Please check your inbox.
              </div>
              <p className="signup-login" style={{ marginTop: "24px" }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("home");
                    onSignInClick();
                  }}
                  className="link"
                >
                  Back to Sign In
                </a>
              </p>
            </div>
          ) : (
            <form className="forgot-password-card" onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label>
                  Email Address <span className="req">(required)</span>
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button
                className="btn btn-primary btn-large"
                type="submit"
                disabled={loading}
                style={{ width: "100%" }}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <p className="signup-login">
                Remember your password?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate("home");
                    onSignInClick();
                  }}
                  className="link"
                >
                  Sign in here
                </a>
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default ForgotPassword;
