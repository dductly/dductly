import React, { useState, useEffect, useRef } from "react";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import SignUp from "./pages/SignUp";
import EmailConfirmation from "./pages/EmailConfirmation";
import Import from "./pages/Import";
import Dashboard from "./pages/Dashboard";
import AddData from "./pages/AddData";
import Expenses from "./pages/Expenses";
// Using MockAuthContext for testing without Supabase
// To switch to real Supabase, change this import to: import { AuthProvider } from "./contexts/AuthContext";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { ExpensesProvider } from "./contexts/ExpensesContext";
import openEyeIcon from "./img/open-eye.svg";
import closedEyeIcon from "./img/closed-eye.svg";

interface NavProps {
  onNavigate: (page: string) => void;
  onSignInClick: () => void;
}

const Nav: React.FC<NavProps> = ({ onNavigate, onSignInClick }) => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="nav-wrap">
      <nav className="nav" aria-label="Main">
        <a
          className="brand"
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("home");
          }}
        >
          <img src="/duck.svg" alt="dductly logo" className="brand-logo" />
          dductly
        </a>

        <div className="menu">
          {!user && (
            <>
              <button className="btn btn-ghost btn-small" onClick={onSignInClick}>
                Sign In
              </button>
              <button
                className="btn btn-primary btn-small"
                onClick={() => onNavigate("signup")}
              >
                Sign Up
              </button>
            </>
          )}

          {user && (
            <div className="user-menu" ref={menuRef}>
              <button className='btn btn-primary btn-small' onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {user.user_metadata?.first_name} {user.user_metadata?.last_name}
              </button>
              {isMenuOpen && (
                <div className="dropdown-menu">
                  <a
                    href="#contact"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("contact");
                      setIsMenuOpen(false);
                    }}
                  >
                    Contact
                  </a>

                  <a
                    href="#import"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("import");
                      setIsMenuOpen(false);
                    }}
                  >
                    Import Data
                  </a>

                  <a
                    href="#profile"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("profile");
                      setIsMenuOpen(false);
                    }}
                  >
                    Profile
                  </a>
                  <a
                    href="#settings"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("settings");
                      setIsMenuOpen(false);
                    }}
                  >
                    Settings
                  </a>
                  <a
                    href="#logout"
                    onClick={(e) => {
                      e.preventDefault(); // prevent default navigation
                      handleLogout();     // call your logout function
                      setIsMenuOpen(false); // close the dropdown
                    }}
                    >
                    Logout
                  </a>
                </div>
              )}
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
  const [showPassword, setShowPassword] = useState(false);
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
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <img
                  src={showPassword ? openEyeIcon : closedEyeIcon}
                  alt={showPassword ? "Hide password" : "Show password"}
                  className="eye-icon"
                />
              </button>
            </div>
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
  const [legalModal, setLegalModal] = useState<'tos' | 'privacy' | 'faq' | null>(null);
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
      case 'add-data':
        return <AddData onNavigate={handleNavigate} />;
      case 'expenses':
        return <Expenses onNavigate={handleNavigate} />;
      default:
        // Show dashboard if user is logged in, otherwise show public home page
        if (user) {
          return <Dashboard onNavigate={handleNavigate} onFaqClick={() => setLegalModal('faq')} />;
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

      {/* FAQ Modal */}
      {legalModal === 'faq' && (
        <div className="modal-overlay" onClick={() => setLegalModal(null)}>
          <div className="modal-content modal-legal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setLegalModal(null)} aria-label="Close">×</button>
            <h2 className="modal-title">Frequently Asked Questions</h2>
            <div className="modal-body">
              <h3>General Questions</h3>

              <h4>What is dductly?</h4>
              <p>dductly is an expense tracking and financial management platform designed specifically for farmers market vendors and small business owners. We help you organize your business expenses, track receipts, and generate reports for tax time.</p>

              <h4>Who is dductly for?</h4>
              <p>dductly is built for farmers market vendors, craft fair sellers, local makers, and small business owners who need a simple way to track expenses and stay organized for tax season.</p>

              <h4>How much does dductly cost?</h4>
              <p>We offer flexible pricing plans to fit your needs. Contact us for current pricing information and to find the plan that works best for your business.</p>

              <h3>Getting Started</h3>

              <h4>How do I create an account?</h4>
              <p>Click the "Sign Up" button in the navigation menu, fill out the registration form with your details, and verify your email address. Once verified, you can start using dductly right away!</p>

              <h4>What information do I need to provide?</h4>
              <p>You'll need to provide your name, email address, and create a password. Additional business information can be added later in your account settings.</p>

              <h3>Using dductly</h3>

              <h4>How do I import my expense data?</h4>
              <p>You can import expense data through our Import Data feature. We support various file formats including CSV and Excel. Simply click "Import Data" from your dashboard and follow the prompts.</p>

              <h4>Can I manually add expenses?</h4>
              <p>Yes! Use the "Add Data" button on your dashboard to manually enter individual expenses. This is perfect for adding receipts on the go.</p>

              <h4>What types of expenses can I track?</h4>
              <p>You can track all business-related expenses including booth fees, supplies, materials, travel costs, equipment, marketing expenses, and more.</p>

              <h4>Can I categorize my expenses?</h4>
              <p>Yes, dductly allows you to categorize expenses to help you understand where your money is going and make tax time easier.</p>

              <h3>Reports & Exports</h3>

              <h4>How do I generate reports?</h4>
              <p>Navigate to your dashboard and use the reporting tools to generate expense summaries, tax reports, and custom reports for any date range.</p>

              <h4>What export formats are available?</h4>
              <p>You can export your data in multiple formats including PDF, CSV, and Excel, making it easy to share with your accountant or use with other software.</p>

              <h3>Account & Security</h3>

              <h4>Is my data secure?</h4>
              <p>Yes! We take data security seriously. All data is encrypted and stored securely. We never share your personal or business information with third parties. See our Privacy Policy for more details.</p>

              <h4>How do I reset my password?</h4>
              <p>Click "Sign In" and then "Forgot Password" to receive a password reset link via email.</p>

              <h4>Can I delete my account?</h4>
              <p>Yes, you can delete your account at any time from your account settings. Please note that this action is permanent and cannot be undone.</p>

              <h3>Support</h3>

              <h4>How do I contact support?</h4>
              <p>You can reach our support team through the Contact page. We typically respond within 24 hours during business days.</p>

              <h4>Do you offer tutorials or guides?</h4>
              <p>Yes! Check out our User Guide and tutorial videos to learn how to make the most of dductly's features.</p>

              <h4>What if I have a feature request?</h4>
              <p>We love hearing from our users! Contact us with your feature requests and suggestions. We're constantly improving dductly based on user feedback.</p>
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
      <ExpensesProvider>
        <AppContent />
      </ExpensesProvider>
    </AuthProvider>
  );
};

export default App;
