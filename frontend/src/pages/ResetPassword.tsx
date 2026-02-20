import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import openEyeIcon from "../img/open-eye.svg";
import closedEyeIcon from "../img/closed-eye.svg";

interface ResetPasswordProps {
  onNavigate: (page: string) => void;
  onSignInClick: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onNavigate, onSignInClick }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  // Wait for Supabase to establish the recovery session from the URL token/code
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // Also check if session already exists (PKCE may have processed before mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      }
    });

    // Fallback: show the form after 2 seconds regardless
    const timeout = setTimeout(() => setReady(true), 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordChecks).every((check) => check);
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = isPasswordValid && passwordsMatch && newPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Sign out and open sign-in modal after 3 seconds
        setTimeout(async () => {
          await supabase.auth.signOut();
          onNavigate("home");
          onSignInClick();
        }, 3000);
      }
    } catch {
      setError("Unable to update password. Please try again later.");
    }

    setLoading(false);
  };

  return (
    <div className="page">
      <section className="section">
        <div className="forgot-password-container">
          <h1 className="section-title">Set New Password</h1>
          <p className="forgot-password-subtitle">
            Choose a new password for your dductly account.
          </p>

          {success ? (
            <div className="forgot-password-card">
              <div className="success-banner">
                Password updated successfully! Redirecting to sign in...
              </div>
            </div>
          ) : !ready ? (
            <div className="forgot-password-card">
              <p style={{ color: "var(--text-medium)", textAlign: "center" }}>
                Verifying your reset link...
              </p>
            </div>
          ) : (
            <form className="forgot-password-card" onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    <img
                      src={showNewPassword ? openEyeIcon : closedEyeIcon}
                      alt={showNewPassword ? "Hide password" : "Show password"}
                      className="eye-icon"
                    />
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <div className="password-requirements">
                    <div className={`requirement ${passwordChecks.length ? "met" : ""}`}>
                      <span className="requirement-icon">{passwordChecks.length ? "\u2713" : "\u25CB"}</span>
                      At least 8 characters
                    </div>
                    <div className={`requirement ${passwordChecks.uppercase ? "met" : ""}`}>
                      <span className="requirement-icon">{passwordChecks.uppercase ? "\u2713" : "\u25CB"}</span>
                      One uppercase letter
                    </div>
                    <div className={`requirement ${passwordChecks.lowercase ? "met" : ""}`}>
                      <span className="requirement-icon">{passwordChecks.lowercase ? "\u2713" : "\u25CB"}</span>
                      One lowercase letter
                    </div>
                    <div className={`requirement ${passwordChecks.number ? "met" : ""}`}>
                      <span className="requirement-icon">{passwordChecks.number ? "\u2713" : "\u25CB"}</span>
                      One number
                    </div>
                    <div className={`requirement ${passwordChecks.special ? "met" : ""}`}>
                      <span className="requirement-icon">{passwordChecks.special ? "\u2713" : "\u25CB"}</span>
                      One special character (!@#$%^&*)
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <img
                      src={showConfirmPassword ? openEyeIcon : closedEyeIcon}
                      alt={showConfirmPassword ? "Hide password" : "Show password"}
                      className="eye-icon"
                    />
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <div style={{ color: "#c33", fontSize: "0.875rem", marginTop: "8px" }}>
                    Passwords do not match
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary btn-large"
                type="submit"
                disabled={loading || !canSubmit}
                style={{ width: "100%" }}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>

              <p className="signup-login">
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
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default ResetPassword;
