import React, { useState } from "react";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import SignUp from "./pages/SignUp";
import EmailConfirmation from "./pages/EmailConfirmation";
import Import from "./pages/Import";
import Dashboard from "./pages/Dashboard";
// Using real Supabase authentication
import { AuthProvider } from "./contexts/AuthContext";
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
          {user && (
            <a href="#import" onClick={(e) => { e.preventDefault(); onNavigate('import'); }}>Import Data</a>
          )}
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

interface FooterProps {
  onLegalClick: (type: 'tos' | 'privacy') => void;
}

const Footer: React.FC<FooterProps> = ({ onLegalClick }) => (
  <footer className="footer">
    <span>© {new Date().getFullYear()} dductly | All rights reserved</span>
    <span>
      <a href="#" onClick={(e) => { e.preventDefault(); onLegalClick('privacy'); }} className="link" style={{ color: 'var(--primary-purple)', fontWeight: 700, textDecoration: 'none' }}>Privacy</a>
      {' · '}
      <a href="#" onClick={(e) => { e.preventDefault(); onLegalClick('tos'); }} className="link" style={{ color: 'var(--primary-purple)', fontWeight: 700, textDecoration: 'none' }}>Terms</a>
    </span>
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
  const [legalModal, setLegalModal] = useState<'tos' | 'privacy' | null>(null);
  const { loading, user } = useAuth();

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
      case 'import':
        return <Import />;
      default:
        // Show dashboard if user is logged in, otherwise show public home page
        if (user) {
          return <Dashboard onNavigate={handleNavigate} />;
        }
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
        <Footer onLegalClick={setLegalModal} />
      </div>
    );
  }

  return (
    <div className="site">
      <Nav onNavigate={handleNavigate} onSignInClick={handleSignInClick} />
      <main>
        {renderCurrentPage()}
      </main>
      <Footer onLegalClick={setLegalModal} />
      {isSignInOpen && (
        <SignInModal onClose={handleCloseSignIn} onSignUpClick={handleSignUpClick} />
      )}

      {/* Terms of Service Modal */}
      {legalModal === 'tos' && (
        <div className="modal-overlay" onClick={() => setLegalModal(null)}>
          <div className="modal-content modal-legal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setLegalModal(null)} aria-label="Close">×</button>
            <h2 className="modal-title">Terms of Service</h2>
            <div className="modal-body">
              <p><strong>Last Updated:</strong> October 28, 2025</p>

              <h3>1. Acceptance of Terms</h3>
              <p>By accessing and using dductly, you accept and agree to be bound by the terms and provisions of this agreement.</p>

              <h3>2. Use of Service</h3>
              <p>dductly provides expense tracking and financial management tools for farmers market vendors. You agree to use the service only for lawful purposes and in accordance with these Terms.</p>

              <h3>3. User Accounts</h3>
              <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>

              <h3>4. Data and Privacy</h3>
              <p>Your use of dductly is also governed by our Privacy Policy. We collect and use your data to provide and improve our services.</p>

              <h3>5. Intellectual Property</h3>
              <p>The service and its original content, features, and functionality are owned by dductly and are protected by international copyright, trademark, and other intellectual property laws.</p>
              <p>Free icons from <a href="https://www.streamlinehq.com/" target="_blank" rel="noopener noreferrer" className="link">Streamline</a>.</p>

              <h3>6. Limitation of Liability</h3>
              <p>dductly shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>

              <h3>7. Changes to Terms</h3>
              <p>We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page.</p>

              <h3>8. Contact Information</h3>
              <p>If you have any questions about these Terms, please contact us through our contact form.</p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {legalModal === 'privacy' && (
        <div className="modal-overlay" onClick={() => setLegalModal(null)}>
          <div className="modal-content modal-legal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setLegalModal(null)} aria-label="Close">×</button>
            <h2 className="modal-title">Privacy Policy</h2>
            <div className="modal-body">
              <p><strong>Last Updated:</strong> October 28, 2025</p>

              <h3>1. Information We Collect</h3>
              <p>We collect information you provide directly to us, including your name, email address, phone number, and business expense data that you choose to track through our service.</p>

              <h3>2. How We Use Your Information</h3>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide, maintain, and improve our services</li>
                <li>Process and complete transactions</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns to improve user experience</li>
              </ul>

              <h3>3. Information Sharing</h3>
              <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
              <ul>
                <li>With your consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
              </ul>

              <h3>4. Data Security</h3>
              <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing and accidental loss, destruction, or damage.</p>

              <h3>5. Your Rights</h3>
              <p>You have the right to access, update, or delete your personal information at any time through your account settings or by contacting us.</p>

              <h3>6. Cookies and Tracking</h3>
              <p>We use cookies and similar tracking technologies to track activity on our service and hold certain information to improve and analyze our service.</p>

              <h3>7. Children's Privacy</h3>
              <p>Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.</p>

              <h3>8. Changes to Privacy Policy</h3>
              <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

              <h3>9. Contact Us</h3>
              <p>If you have any questions about this Privacy Policy, please contact us through our contact form.</p>
            </div>
          </div>
        </div>
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
