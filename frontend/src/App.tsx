import React, { useState } from "react";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import SignUp from "./pages/SignUp";
import EmailConfirmation from "./pages/EmailConfirmation";
// Using MockAuthContext for testing without Supabase
// To switch to real Supabase, change this import to: import { AuthProvider } from "./contexts/AuthContext";
import { AuthProvider } from "./contexts/MockAuthContext";
import { useAuth } from "./hooks/useAuth";

interface NavProps {
  onNavigate: (page: string) => void;
  onSignInClick: () => void;
}

const Nav: React.FC<NavProps> = ({ onNavigate, onSignInClick }) => {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="nav-wrap">
      <nav className="nav" aria-label="Main">
        <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
          <img src="/duck.svg" alt="dductly logo" className="brand-logo" />
          dductly
        </a>
        <div className="menu">
          <a href="#contact" onClick={(e) => { e.preventDefault(); onNavigate('contact'); }}>Contact</a>
          {!user && (
            <>
              <button className="btn btn-ghost btn-small" onClick={onSignInClick}>Sign In</button>
              <button className="btn btn-primary btn-small" onClick={() => onNavigate('signup')}>Sign Up</button>
            </>
          )}
          {user && (
            <div className="user-menu">
              <span className="user-name">
                {user.user_metadata?.first_name} {user.user_metadata?.last_name}
              </span>
              <button className="btn btn-ghost btn-small" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

const Footer: React.FC = () => (
  <footer className="footer">
    <span>© {new Date().getFullYear()} dductly | All rights reserved</span>
    <span>Privacy · Terms</span>
  </footer>
);

interface SignInModalProps {
  onClose: () => void;
  onSignUpClick: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ onClose, onSignUpClick }) => {
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
      onClose();
    }
    
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <h2 className="modal-title">Welcome Back</h2>
        <p className="modal-subtitle">Sign in to your dductly account</p>
        
        <form className="modal-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label>Email Address</label>
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
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <button className="btn btn-primary btn-large" type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
          
          <p className="modal-footer-text">
            Don't have an account?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onClose(); onSignUpClick(); }} className="link">
              Sign up here
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const { loading } = useAuth();

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleSignInClick = () => {
    setIsSignInOpen(true);
  };

  const handleCloseSignIn = () => {
    setIsSignInOpen(false);
  };

  const handleSignUpClick = () => {
    setCurrentPage('signup');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'contact':
        return <Contact />;
      case 'signup':
        return <SignUp onNavigate={handleNavigate} />;
      case 'confirm-email':
        return <EmailConfirmation onNavigate={handleNavigate} />;
      default:
        return (
          <>
            <Home />
            <Services />
            <Contact />
          </>
        );
    }
  };

  if (loading) {
    return (
      <div className="site">
        <Nav onNavigate={handleNavigate} onSignInClick={handleSignInClick} />
        <main>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <p style={{ color: 'var(--cream-text)', fontSize: '1.2rem' }}>Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="site">
      <Nav onNavigate={handleNavigate} onSignInClick={handleSignInClick} />
      <main>
        {renderCurrentPage()}
      </main>
      <Footer />
      {isSignInOpen && (
        <SignInModal onClose={handleCloseSignIn} onSignUpClick={handleSignUpClick} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;