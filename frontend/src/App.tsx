import React, { useState, useEffect, useRef, useCallback } from "react";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import SignUp from "./pages/SignUp";
import EmailConfirmation from "./pages/EmailConfirmation";
import Import from "./pages/Import";
import Dashboard from "./pages/Dashboard";
import AddData from "./pages/AddData";
import Expenses from "./pages/Expenses";
import AddIncome from "./pages/AddIncome";
import IncomePage from "./pages/Income";
import Stats from "./pages/Stats";
import TaxInsights from "./pages/TaxInsights";
import Settings from "./pages/Settings";
import Features from "./pages/Features";
import AppCarousel from "./pages/AppCarousel";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import InactivityWarningModal from "./components/InactivityWarningModal";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Support from "./pages/Support";
import WhereToSell from "./pages/WhereToSell";
// Using real AuthContext with Supabase
// Using MockAuthContext for testing without Supabase
// To switch to real Supabase, change this import to: import { AuthProvider } from "./contexts/AuthContext";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { supabase } from "./lib/supabaseClient";
import dductlyLogo from "./img/dductlylogo.png";
import { useInactivity } from "./hooks/useInactivity";
import { ExpensesProvider } from "./contexts/ExpensesContext";
import { IncomeProvider } from "./contexts/IncomeContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { InactivityProvider } from "./contexts/InactivityContext";
import openEyeIcon from "./img/open-eye.svg";
import closedEyeIcon from "./img/closed-eye.svg";
import lightModeIcon from "./img/light-mode.svg";
import darkModeIcon from "./img/dark-mode-tilted.svg";

interface NavProps {
  onNavigate: (page: string) => void;
  onSignInClick: () => void;
}

const Nav: React.FC<NavProps> = ({ onNavigate, onSignInClick }) => {
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
    onNavigate('home');
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
          <img src={dductlyLogo} alt="dductly logo" className="brand-logo" />
          dductly
        </a>

        <div className="menu">
          {/* Dark Mode Toggle */}
          <button
            className="theme-toggle" 
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <img
              src={isDarkMode ? lightModeIcon : darkModeIcon}
              alt={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                width: "20px",
                height: "20px",
                transform: isDarkMode 
                  ? "none" 
                  : "scale(1.25) translate(1px, 0px)",   // adjust here
                transformOrigin: "center"
              }}
            />
          </button>

          {!user && (
            <>
              <button className="btn btn-ghost btn-small" onClick={onSignInClick}>
                Log In
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
                    href="#settings"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate("settings");
                      setIsMenuOpen(false);
                    }}
                  >
                    Settings
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      void handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    Logout
                  </button>
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
  onNavigate: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => (
  <footer className="footer">
    <span>© {new Date().getFullYear()} dductly | All rights reserved</span>
    <span>
      <a
        href="/privacy"
        onClick={(e) => {
          e.preventDefault();
          onNavigate("privacy");
        }}
        className="link"
        style={{ color: "var(--primary-purple)", fontWeight: 700, textDecoration: "none" }}
      >
        Privacy
      </a>
      {" · "}
      <a
        href="/terms"
        onClick={(e) => {
          e.preventDefault();
          onNavigate("terms");
        }}
        className="link"
        style={{ color: "var(--primary-purple)", fontWeight: 700, textDecoration: "none" }}
      >
        Terms
      </a>
      {" · "}
      <a
        href="/support"
        onClick={(e) => {
          e.preventDefault();
          onNavigate("support");
        }}
        className="link"
        style={{ color: "var(--primary-purple)", fontWeight: 700, textDecoration: "none" }}
      >
        Support
      </a>
    </span>
    <span className="footer-social">
      <a
        href="https://www.instagram.com/dductly/"
        target="_blank"
        rel="noopener noreferrer"
        className="social-icon"
        aria-label="Follow us on Instagram"
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
          <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2"/>
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
        </svg>
      </a>
      <a
        href="https://www.tiktok.com/@dductly"
        target="_blank"
        rel="noopener noreferrer"
        className="social-icon"
        aria-label="Follow us on TikTok"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
        </svg>
      </a>
    </span>
  </footer>
);

interface SignInModalProps {
  onClose: () => void;
  onSignUpClick: () => void;
  onForgotPasswordClick: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ onClose, onSignUpClick, onForgotPasswordClick }) => {
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
        <p className="modal-subtitle">Log in to your dductly account</p>
        
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
          
          <p className="forgot-password-link">
            <a href="#" onClick={(e) => { e.preventDefault(); onClose(); onForgotPasswordClick(); }} className="link">
              Forgot your password?
            </a>
          </p>

          <button className="btn btn-primary btn-large" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
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

const getInitialPage = () => {
  const path = window.location.pathname;
  const page = path === '/' || path === '' ? 'home' : path.substring(1);
  // Also check for recovery/confirmation tokens in URL
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const queryParams = new URLSearchParams(window.location.search);
  if (
    (hashParams.get('access_token') && hashParams.get('type') === 'recovery') ||
    (queryParams.get('token') && queryParams.get('type') === 'recovery') ||
    (queryParams.get('code') && page === 'reset-password')
  ) {
    return 'reset-password';
  }
  if (
    (hashParams.get('access_token') && hashParams.get('type') === 'email') ||
    (queryParams.get('token') && queryParams.get('type') === 'email')
  ) {
    return 'confirm-email';
  }
  if (queryParams.get('stripe_session_id')) {
    return 'signup';
  }
  return page;
};

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [stripeSignupReturnSessionId, setStripeSignupReturnSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("stripe_session_id");
  });
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<"faq" | "guide" | null>(null);
  const { loading, user } = useAuth();
  const { showWarning, remainingSeconds, resetActivity } = useInactivity();

  const clearStripeSignupReturn = useCallback(() => {
    setStripeSignupReturnSessionId(null);
  }, []);

  useEffect(() => {
    console.log('[AppContent] showWarning changed to:', showWarning, 'user:', !!user);
  }, [showWarning, user]);

  // Listen for PASSWORD_RECOVERY event and navigate to reset-password page
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setCurrentPage('reset-password');
        window.history.replaceState({ page: 'reset-password' }, '', '/reset-password');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Redirect to home page when user logs out (only after auth has finished loading)
  useEffect(() => {
    if (
      !loading &&
      !user &&
      currentPage !== "home" &&
      currentPage !== "signup" &&
      currentPage !== "confirm-email" &&
      currentPage !== "forgot-password" &&
      currentPage !== "reset-password" &&
      currentPage !== "contact" &&
      currentPage !== "privacy" &&
      currentPage !== "terms" &&
      currentPage !== "support"
    ) {
      console.log('[AppContent] User logged out, navigating to home');
      setCurrentPage('home');
    }
  }, [loading, user, currentPage]);

  // Handle browser back/forward buttons and page refresh
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      console.log('[History] Back/forward button clicked, state:', event.state);
      if (event.state && event.state.page) {
        console.log('[History] Navigating to page:', event.state.page);
        setCurrentPage(event.state.page);
      } else {
        console.log('[History] No page state, defaulting to home');
        setCurrentPage('home');
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Check for email confirmation tokens in URL (hash or query params)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    const hasConfirmationToken =
      (hashParams.get('access_token') && hashParams.get('type') === 'email') ||
      (queryParams.get('token') && queryParams.get('type') === 'email');
    const hasRecoveryToken =
      (hashParams.get('access_token') && hashParams.get('type') === 'recovery') ||
      (queryParams.get('token') && queryParams.get('type') === 'recovery');
    const stripeCheckoutReturnId = queryParams.get("stripe_session_id");

    // Set initial state from URL on page load/refresh
    const currentPath = window.location.pathname;
    let initialPage = currentPath === '/' || currentPath === '' ? 'home' : currentPath.substring(1);

    // If we have recovery tokens, route to reset-password page
    if (hasRecoveryToken) {
      initialPage = 'reset-password';
    }
    // If we have confirmation tokens, route to confirm-email page (even if path is /)
    else if (hasConfirmationToken) {
      initialPage = 'confirm-email';
    } else if (stripeCheckoutReturnId) {
      initialPage = 'signup';
    }
    
    console.log('[History] Initial setup, path:', currentPath, 'page:', initialPage);

    // Actually set the current page based on URL
    if (initialPage !== 'home') {
      setCurrentPage(initialPage);
    }

    // Use appropriate URL when we have tokens so the path is valid and refresh works
    const pathForHistory = hasRecoveryToken
      ? '/reset-password'
      : hasConfirmationToken
        ? '/confirm-email'
        : stripeCheckoutReturnId
          ? '/signup'
          : currentPath;
    if (!window.history.state) {
      window.history.replaceState({ page: initialPage }, '', pathForHistory);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleNavigate = (page: string) => {
    console.log('[History] Navigating from', currentPage, 'to', page);
    if (page !== "signup") {
      setStripeSignupReturnSessionId(null);
    }
    setCurrentPage(page);
    // Add to browser history
    const url = page === 'home' ? '/' : `/${page}`;
    window.history.pushState({ page }, '', url);
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
      case "privacy":
        return <PrivacyPolicy onNavigate={handleNavigate} />;
      case "terms":
        return <TermsOfService onNavigate={handleNavigate} />;
      case "support":
        return <Support onNavigate={handleNavigate} />;
      case 'contact':
        return <Contact onNavigate={handleNavigate} />;
      case 'signup':
        if (user && !stripeSignupReturnSessionId) {
          return <Dashboard onNavigate={handleNavigate} onFaqClick={() => setLegalModal('faq')} onUserGuideClick={() => setLegalModal('guide')} />;
        }
        return (
          <SignUp
            onNavigate={handleNavigate}
            stripeCheckoutReturnSessionId={stripeSignupReturnSessionId}
            onStripeCheckoutReturnHandled={clearStripeSignupReturn}
          />
        );
      case 'confirm-email':
        return <EmailConfirmation onNavigate={handleNavigate} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={handleNavigate} onSignInClick={handleSignInClick} />;
      case 'reset-password':
        return <ResetPassword onNavigate={handleNavigate} onSignInClick={handleSignInClick} />;
      case 'import':
        return <Import onNavigate={handleNavigate} />;
      case 'add-data':
        return <AddData onNavigate={handleNavigate} />;
      case 'expenses':
        return <Expenses onNavigate={handleNavigate} />;
      case 'mileage':
        return <Expenses onNavigate={handleNavigate} initialTab="mileage" />;
      case 'add-income':
        return <AddIncome onNavigate={handleNavigate} />;
      case 'income':
        return <IncomePage onNavigate={handleNavigate} />;
      case 'stats':
        return <Stats onNavigate={handleNavigate} />;
      case 'tax-insights':
        return <TaxInsights onNavigate={handleNavigate} />;
      case 'settings':
        return <Settings onNavigate={handleNavigate} />;
      case 'where-to-sell':
        return <WhereToSell onNavigate={handleNavigate} />;
      default:
        // Show dashboard if user is logged in, otherwise show public home page
        if (user) {
          return <Dashboard onNavigate={handleNavigate} onFaqClick={() => setLegalModal('faq')} onUserGuideClick={() => setLegalModal('guide')} />;
        }
        return (
          <>
            <Home onNavigate={handleNavigate} />
            <AppCarousel />
            <Features />
            <Services />
            <Contact onNavigate={handleNavigate} />
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
        <Footer onNavigate={handleNavigate} />
      </div>
    );
  }

  return (
    <div className="site">
      <Nav onNavigate={handleNavigate} onSignInClick={handleSignInClick} />
      <main>
        {renderCurrentPage()}
      </main>
      <Footer onNavigate={handleNavigate} />
      {isSignInOpen && (
        <SignInModal onClose={handleCloseSignIn} onSignUpClick={handleSignUpClick} onForgotPasswordClick={() => handleNavigate('forgot-password')} />
      )}

      {/* Inactivity Warning Modal - Only for authenticated users */}
      {user && showWarning && (
        <InactivityWarningModal
          remainingSeconds={remainingSeconds}
          onStayActive={resetActivity}
        />
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
              <p>dductly is your all-in-one financial tool built for small business owners and solo entrepreneurs. We handle the full picture — tracking your expenses, income, and business mileage, giving you real-time statistics, and generating tax insights so you're always prepared come tax season. No accountant degree required.</p>

              <h4>Who is dductly for?</h4>
              <p>dductly is made for small business owners, solo entrepreneurs, freelancers, independent contractors, and anyone running their own operation who wants a smarter way to manage their money and stay on top of their deductions.</p>

              <h4>How much does dductly cost?</h4>
              <p>
                dductly is $8.50/month (billed monthly) or $78/year (billed yearly)—about $6.50/month when you pay
                annually. Pricing includes the fee to connect your bank. One plan, all features included.
              </p>

              <h3>Getting Started</h3>

              <h4>How do I create an account?</h4>
              <p>Click the "Sign Up" button in the navigation menu, fill out the registration form with your details, and verify your email address. Once verified, you can start using dductly right away!</p>

              <h4>What information do I need to provide?</h4>
              <p>Just your name, email address, and a password. You can start logging expenses and income right after signup — no lengthy setup required.</p>

              <h3>Tracking Your Finances</h3>

              <h4>What can I track with dductly?</h4>
              <p>dductly covers all the essentials for your small business finances:</p>
              <ul>
                <li><strong>Expenses:</strong> Supplies, equipment, travel, marketing, utilities, insurance, and more — with receipt uploads and category tagging</li>
                <li><strong>Income:</strong> Product sales, services, consulting, tips, grants, and other revenue streams</li>
                <li><strong>Business Mileage:</strong> Log every trip and we automatically calculate your deductible using the IRS standard mileage rate ($0.70/mile for 2025)</li>
              </ul>

              <h4>How does the Mileage Tracker work?</h4>
              <p>Head to the Expenses page and tap the Mileage tab. Click "+ Log Trip," enter the date, miles driven, and a description of the trip. dductly does the math — your deductible is calculated instantly at the IRS standard rate. You can also attach photos or receipts to each trip for a complete record.</p>

              <h4>Can I upload receipts and attachments?</h4>
              <p>Yes! You can attach photos, PDFs, or any file to your expenses, income entries, and mileage trips. Drag and drop or click to browse when adding or editing any entry. Never lose a receipt again.</p>

              <h4>Can I import existing data?</h4>
              <p>Yes! Use the "Import Data" feature from your dashboard to upload bulk data from a CSV or Excel file. Great for moving data from another system or adding a large batch of entries at once.</p>

              <h3>Tax Insights</h3>

              <h4>What is the Tax Insights page?</h4>
              <p>Tax Insights is your built-in tax prep tool. It gives you a real-time snapshot of your estimated deductibles organized by Schedule C category, a write-off guide covering every common small business deduction, key tax deadlines to keep on your radar, and a CSV export you can hand straight to your accountant.</p>

              <h4>How does dductly calculate my deductibles?</h4>
              <p>We add up your categorized expenses and mileage to estimate your Schedule C deductions. Mileage is calculated at the IRS standard rate ($0.70/mile for 2025). These are estimates to help you plan — always confirm the final numbers with a tax professional.</p>

              <h4>What is the Write-off Guide?</h4>
              <p>The Write-off Guide inside Tax Insights walks you through every major small business deduction category — home office, phone and internet, vehicle mileage, equipment, education, health insurance, retirement contributions, professional services, business meals, and more. Each category includes tips on what qualifies and which Schedule C line it maps to.</p>

              <h3>Statistics</h3>

              <h4>How do I view my financial statistics?</h4>
              <p>Click "Statistics" from your dashboard to see a full picture of your business finances — total revenue, total expenses, net profit, breakdowns by category, and trends over time. Filter by date range to see exactly the period you care about.</p>

              <h4>Can I export my data?</h4>
              <p>Yes! Export your data as CSV from Tax Insights for your accountant, or use the Statistics and expenses/income pages to review and download your records.</p>

              <h3>Account & Security</h3>

              <h4>Is my data secure?</h4>
              <p>Absolutely. All your data is encrypted and stored securely. Uploaded files are protected with secure cloud storage. For added security, you'll be automatically logged out after 15 minutes of inactivity.</p>

              <h4>How do I reset my password?</h4>
              <p>Click "Log in" and then "Forgot Password" to receive a password reset link via email.</p>

              <h4>Can I delete my account?</h4>
              <p>Yes, you can delete your account at any time from your account settings. Please note that this action is permanent and cannot be undone.</p>

              <h3>Support</h3>

              <h4>How do I contact support?</h4>
              <p>Reach our support team through the Contact page on your dashboard. We typically respond within 24 hours during business days.</p>

              <h4>What if I have a feature request?</h4>
              <p>We love hearing from our users — dductly is built on your feedback. Send us your ideas through the Contact page and we'll take a look.</p>
            </div>
          </div>
        </div>
      )}

      {/* User Guide Modal */}
      {legalModal === 'guide' && (
        <div className="modal-overlay" onClick={() => setLegalModal(null)}>
          <div className="modal-content modal-legal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setLegalModal(null)} aria-label="Close">×</button>
            <h2 className="modal-title">User Guide</h2>
            <div className="modal-body">
              <p>Welcome to dductly — your financial tool built for small business owners and solo entrepreneurs. This guide walks you through every feature so you can get the most out of your account.</p>

              <h3>Getting Started</h3>

              <h4>1. Creating Your Account</h4>
              <p>Click "Sign Up" and fill in your information. Your password must include:</p>
              <ul>
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character (!@#$%^&*)</li>
              </ul>
              <p>Check your email to verify your account, then log in to access your dashboard.</p>

              <h4>2. Your Dashboard</h4>
              <p>Your dashboard is your financial home base. From here you can jump to any feature:</p>
              <ul>
                <li><strong>Expenses:</strong> View, add, and manage all your business expenses — including the Mileage Tracker</li>
                <li><strong>Income:</strong> View and manage all your revenue and income entries</li>
                <li><strong>Import Data:</strong> Upload bulk data from a CSV or Excel file</li>
                <li><strong>Tax Insights:</strong> See your estimated deductibles, write-off guide, and key tax deadlines</li>
                <li><strong>Statistics:</strong> Visualize your revenue, expenses, and profit over time</li>
              </ul>
              <p>The dashboard also shows a live snapshot of your revenue, expenses, and net profit at a glance.</p>

              <h3>Managing Expenses</h3>

              <h4>Adding an Expense</h4>
              <p>Go to the Expenses page and click "+ Add Expense." Fill in:</p>
              <ul>
                <li><strong>Date:</strong> When the expense occurred (required)</li>
                <li><strong>Amount:</strong> Just type the number — formatting is automatic (required)</li>
                <li><strong>Category:</strong> Supplies, Materials, Equipment, Travel, Marketing, Packaging, Utilities, Insurance, or Other (required)</li>
                <li><strong>Payment Method:</strong> Cash, Credit Card, Debit Card, Check, Bank Transfer, or Other (optional)</li>
                <li><strong>Vendor/Store Name:</strong> Where you made the purchase (optional)</li>
                <li><strong>Title:</strong> A short description (optional)</li>
                <li><strong>Attachments:</strong> Receipts, photos, or documents (optional)</li>
              </ul>
              <p>After saving, you'll land back on your expenses list to see the new entry.</p>

              <h4>Viewing, Editing & Deleting Expenses</h4>
              <p>Your expenses list lets you filter by category, sort by date or amount, and search by keyword. Click the three-line menu icon on any entry to:</p>
              <ul>
                <li><strong>View:</strong> See full details and attached files</li>
                <li><strong>Edit:</strong> Update any field or manage attachments</li>
                <li><strong>Delete:</strong> Permanently remove the entry</li>
              </ul>

              <h3>Mileage Tracker</h3>
              <p>Business mileage is one of the most overlooked deductions for small business owners and solo entrepreneurs. dductly makes it effortless to log and calculate.</p>

              <h4>Logging a Trip</h4>
              <ol>
                <li>Go to the Expenses page and click the <strong>Mileage</strong> tab</li>
                <li>Click <strong>+ Log Trip</strong></li>
                <li>Enter the date, miles driven, and a trip description</li>
                <li>Optionally attach a photo or document</li>
                <li>Click Save — your deductible is calculated automatically at the IRS standard rate ($0.70/mile for 2025)</li>
              </ol>

              <h4>Viewing & Managing Trips</h4>
              <p>The Mileage tab shows your total miles and total deductible for the year, plus a full history of every logged trip. Use the three-line menu on any trip to View, Edit, or Delete it — just like regular expenses.</p>

              <h3>Managing Income</h3>

              <h4>Adding Income</h4>
              <p>Go to the Income page and click "+ Add Income." Fill in:</p>
              <ul>
                <li><strong>Date:</strong> When the income was received (required)</li>
                <li><strong>Amount:</strong> Dollar amount with automatic formatting (required)</li>
                <li><strong>Tip:</strong> Any tip amount received (optional)</li>
                <li><strong>Category:</strong> Product Sales, Services, Consulting, Grants, and more (required)</li>
                <li><strong>Payment Method:</strong> Cash, Credit Card, Debit Card, Venmo, Check, Bank Transfer, or Other (optional)</li>
                <li><strong>Customer:</strong> Customer name if applicable (optional)</li>
                <li><strong>Title:</strong> A short description (optional)</li>
                <li><strong>Attachments:</strong> Invoices, receipts, or documents (optional)</li>
              </ul>

              <h4>Viewing and Editing Income</h4>
              <p>Your income list works just like expenses — filter, sort, search, and use the three-line menu to View, Edit, or Delete any entry.</p>

              <h3>Uploading Attachments</h3>
              <p>You can attach files to any expense, income entry, or mileage trip:</p>
              <ul>
                <li>Drag and drop files or click the upload area to browse</li>
                <li>Add or remove attachments at any time by editing the entry</li>
                <li>Click any attached file to open it</li>
              </ul>
              <p>Works on desktop and mobile — snap a photo of a receipt on your phone and upload it instantly.</p>

              <h3>Tax Insights</h3>
              <p>Tax Insights is your built-in tax prep assistant. It pulls together everything you've logged to give you a clear picture of your deductions and tax situation.</p>

              <h4>Tax Snapshot</h4>
              <p>See your estimated Schedule C deductibles broken down by category — expenses, mileage, and more. Mileage is shown with a full breakdown (miles × IRS rate = deductible). The snapshot also flags any common deduction categories you haven't logged yet so nothing slips through the cracks.</p>

              <h4>Write-off Guide</h4>
              <p>Not sure what counts as a deduction? The Write-off Guide covers every major business expense category — home office, phone and internet, vehicle mileage, software, equipment, education, health insurance, retirement contributions, professional services, business meals, shipping, and more. Each entry explains what qualifies and which Schedule C line it belongs on.</p>

              <h4>Key Tax Deadlines</h4>
              <p>Tax Insights includes a deadlines section with important dates for quarterly estimated taxes and annual filing so you always know what's coming up.</p>

              <h4>Export for Your Accountant</h4>
              <p>Use the CSV export button on Tax Insights to download a clean summary of your deductibles by category — ready to hand to your accountant or tax preparer.</p>

              <h3>Statistics</h3>
              <p>The Statistics page gives you a visual overview of your business finances:</p>
              <ul>
                <li>Total revenue, total expenses, and net profit</li>
                <li>Breakdowns by category</li>
                <li>Trends over your chosen date range</li>
              </ul>
              <p>Check Statistics regularly to keep a pulse on your business performance throughout the year.</p>

              <h3>Importing Data</h3>
              <p>Already tracking finances somewhere else? Use "Import Data" from your dashboard to upload a CSV or Excel file and bring everything into dductly in bulk.</p>

              <h3>Account Management</h3>

              <h4>Editing Your Profile</h4>
              <ol>
                <li>Find the "Your Account" card on your dashboard</li>
                <li>Click the pencil icon in the top right</li>
                <li>Update your first name, last name, or email</li>
                <li>Click "Save Changes"</li>
              </ol>
              <p><strong>Note:</strong> If you change your email, you'll receive a confirmation email. After confirming, click the "Click here to refresh" link on your dashboard to see the updated email.</p>

              <h4>Signing Out</h4>
              <p>Click your name in the top right corner and select "Logout" from the dropdown. For your security, dductly also automatically logs you out after 15 minutes of inactivity.</p>

              <h3>Settings & Preferences</h3>
              <ul>
                <li><strong>Dark Mode:</strong> Toggle dark mode from settings for comfortable viewing in any environment</li>
                <li><strong>Auto-Logout:</strong> Automatically signs you out after 15 minutes of inactivity</li>
              </ul>

              <h3>Tips for Getting the Most Out of dductly</h3>
              <ul>
                <li>Log expenses, income, and mileage as they happen — don't let them pile up</li>
                <li>Snap photos of receipts right away and attach them before you lose them</li>
                <li>Use consistent categories so your Statistics and Tax Insights stay accurate</li>
                <li>Review Tax Insights regularly — it'll flag deduction categories you might be missing</li>
                <li>Export a CSV before meeting with your accountant to save time</li>
              </ul>

              <h3>Need More Help?</h3>
              <ul>
                <li>Check the <a href="#" onClick={(e) => { e.preventDefault(); setLegalModal('faq'); }} className="link">FAQs</a> for quick answers</li>
                <li>Use the Contact Support link in your dashboard</li>
                <li>Email us at admin@dductly.com</li>
              </ul>

              <p style={{ marginTop: '24px', fontStyle: 'italic' }}>Thank you for using dductly! We're here to help make your business management effortless.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InactivityProvider>
          <ExpensesProvider>
            <IncomeProvider>
              <AppContent />
            </IncomeProvider>
          </ExpensesProvider>
        </InactivityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
