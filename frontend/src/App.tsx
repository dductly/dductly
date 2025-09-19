import React, { useState } from "react";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Subs from "./pages/Subs";
import Contact from "./pages/Contact";
import FAQs from "./pages/FAQs";
import SignUp from "./pages/SignUp";
import LoginPopup from "./components/LoginPopup";

interface NavProps {
  onLoginClick: () => void;
  onNavigate: (page: string) => void;
}

const Nav: React.FC<NavProps> = ({ onLoginClick, onNavigate }) => (
  <header className="nav-wrap">
    <nav className="nav" aria-label="Main">
      <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
        <img src="/duck.svg" alt="dductly logo" className="brand-logo" />
        dductly
      </a>
      <div className="menu">
        <a href="#faqs" onClick={(e) => { e.preventDefault(); onNavigate('faqs'); }}>FAQs</a>
        <a href="#signup" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }}>SignUp</a>
        <button className="login-btn" onClick={onLoginClick}>Login</button>
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
        return <SignUp />;
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

export default App;