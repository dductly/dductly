import React from "react";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Subs from "./pages/Subs";
import Contact from "./pages/Contact";

const Nav: React.FC = () => (
  <header className="nav-wrap">
    <nav className="nav" aria-label="Main">
      <a className="brand" href="#home">
        <img src="/duck.svg" alt="dductly logo" className="brand-logo" />
        dductly
      </a>
      <div className="menu">
        <a href="#services">Services</a>
        <a href="#subscriptions">Subscriptions</a>
        <a href="#contact">Contact</a>
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

const App: React.FC = () => (
  <div className="site">
    <Nav />
    <main>
      <Home />
      <Services />
      <Subs />
      <Contact />
    </main>
    <Footer />
  </div>
);

export default App;