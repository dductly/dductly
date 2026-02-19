import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

interface SignInProps {
  onNavigate?: (page: string) => void;
}

const SignIn: React.FC<SignInProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    } else {
      // Navigate to home page after successful login
      if (onNavigate) {
        onNavigate('home');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="page">
      <section className="section">
        <div className="signup-container">
          <div className="signup-left">
            <h1 className="section-title">Welcome Back</h1>
            <p>Sign in to your dductly account to continue tracking your donations and maximizing your tax savings.</p>
          </div>

          <form className="signup-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <div className="form-group">
              <label>Email Address <span className="req">(required)</span></label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Password <span className="req">(required)</span></label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <p className="forgot-password-link">
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate?.('forgot-password'); }} className="link">
                Forgot your password?
              </a>
            </p>

            <button className="btn btn-primary btn-large" type="submit" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <p className="signup-login">
              Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); onNavigate?.('signup'); }} className="link">Sign up here</a>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
};

export default SignIn;

