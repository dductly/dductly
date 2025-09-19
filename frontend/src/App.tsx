import React, { useState } from "react";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Subs from "./pages/Subs";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import SignupModal from "./components/SignupModal";
import LoginModal from "./components/LoginModal";

interface NavProps {
  onSignupClick: () => void;
  onLoginClick: () => void;
}

const Nav: React.FC<NavProps> = ({ onSignupClick, onLoginClick }) => (
  <header className="nav-wrap">
    <nav className="nav" aria-label="Main">
      <a className="brand" href="#home">
        <img src="/duck.svg" alt="dductly logo" className="brand-logo" />
        dductly
      </a>
      <div className="menu">
        <a href="#faq">FAQ</a>
        <button onClick={onSignupClick} className="nav-button">Signup</button>
        <button onClick={onLoginClick} className="nav-button">Login</button>
      </div>
    </nav>
  </header>
);

const Footer: React.FC = () => (
  <footer className="footer">
    <span>© {new Date().getFullYear()} dductly | All rights reserved</span>
    <span>Privacy · Terms</span>
  </footer>
);

const App: React.FC = () => {
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
        <Home />
        <Services />
        <Subs />
        <Contact />
        <FAQ />
      </main>
      <Footer />

      <SignupModal isOpen={isSignupModalOpen} onClose={closeSignupModal} />
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </div>
  );
};

export default App;