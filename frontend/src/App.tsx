import React, { useState } from "react";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Subs from "./pages/Subs";
import Contact from "./pages/Contact";
import FAQs from "./pages/FAQs";
import SignUp from "./pages/SignUp";
import EmailConfirmation from "./pages/EmailConfirmation";
import LoginPopup from "./components/LoginPopup";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";

interface NavProps {
  onLoginClick: () => void;
  onNavigate: (page: string) => void;
}

const Nav: React.FC<NavProps> = ({ onLoginClick, onNavigate }) => {
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
          <a href="#faqs" onClick={(e) => { e.preventDefault(); onNavigate('faqs'); }}>FAQs</a>
          {!user && (
            <>
              <a href="#signup" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }}>SignUp</a>
              <button className="login-btn" onClick={onLoginClick}>Login</button>
            </>
          )}
          {user && (
            <div className="user-menu">
              <span className="user-name">
                {user.user_metadata?.first_name} {user.user_metadata?.last_name}
              </span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
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

const AppContent: React.FC = () => {
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  const handleLoginClick = () => {
    setIsLoginPopupOpen(true);
  };

  const handleCloseLogin = () => {
    setIsLoginPopupOpen(false);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'faqs':
        return <FAQs />;
      case 'signup':
        return <SignUp onNavigate={handleNavigate} />;
      case 'confirm-email':
        return <EmailConfirmation />;
      default:
        return (
          <>
            <Home />
            <Services />
            <Subs />
            <Contact />
          </>
        );
    }
  };

  return (
    <div className="site">
      <Nav onLoginClick={handleLoginClick} onNavigate={handleNavigate} />
      <main>
        {renderCurrentPage()}
      </main>
      <Footer />
      <LoginPopup isOpen={isLoginPopupOpen} onClose={handleCloseLogin} />
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