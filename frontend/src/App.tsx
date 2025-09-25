import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Services from "./pages/Services";
// hide subscriptions for now
// import Subs from "./pages/Subs";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";

const Nav: React.FC = () => (
  <header className="nav-wrap">
    <nav className="nav" aria-label="Main">
      <Link className="brand" to="/">
        <img src="/duck.svg" alt="dductly logo" className="brand-logo" />
        dductly
      </Link>
      <div className="menu">
        <Link to="/#services">Services</Link>
        <Link to="/faq">FAQ</Link>
        {/* hide subscriptions for now */}
        {/* <Link to="/subscriptions">Subscriptions</Link> */}
        <Link to="/#contact">Contact</Link>
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

const HomePage: React.FC = () => (
  <main>
    <Home />
    <Services />
    {/* hide subscriptions for now */}
    {/* <Subs /> */}
    <Contact />
  </main>
);

const App: React.FC = () => (
  <Router>
    <div className="site">
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/faq" element={<FAQ />} />
      </Routes>
      <Footer />
    </div>
  </Router>
);

export default App;