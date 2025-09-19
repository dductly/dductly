import React, { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import FAQ from "./pages/FAQ";
import Dashboard from "./pages/Dashboard";
import SignupSuccess from "./pages/SignupSuccess";
import SignupModal from "./components/SignupModal";
import LoginModal from "./components/LoginModal";
import ProfileDropdown from "./components/ProfileDropdown";

interface NavProps {
  onSignupClick: () => void;
  onLoginClick: () => void;
}

const Nav: React.FC<NavProps> = ({ onSignupClick, onLoginClick }) => {
  const isLoggedIn = localStorage.getItem('authToken');

  return (
    <header className="nav-wrap">
      <nav className="nav" aria-label="Main">
        <Link className="brand" to="/">
          <img src="/duck.svg" alt="dductly logo" className="brand-logo" />
          dductly
        </Link>
        <div className="menu">
          <Link to="/faq">FAQ</Link>
          {isLoggedIn ? (
            <ProfileDropdown />
          ) : (
            <>
              <button onClick={onSignupClick} className="nav-button">Signup</button>
              <button onClick={onLoginClick} className="nav-button">Login</button>
            </>
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

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleSignupClick = () => {
    setIsSignupModalOpen(true);
  };

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const closeSignupModal = () => {
    setIsSignupModalOpen(false);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  return (
    <div className="site">
      <Nav onSignupClick={handleSignupClick} onLoginClick={handleLoginClick} />
      <main>
        {children}
      </main>
      <Footer />

      <SignupModal isOpen={isSignupModalOpen} onClose={closeSignupModal} />
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout><HomePage /></Layout>} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/signup-success" element={<SignupSuccess />} />
    </Routes>
  );
};

export default App;