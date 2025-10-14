import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import Import from "./pages/Import";

const Nav: React.FC = () => {
  const location = useLocation();
  const isImportPage = location.pathname === "/import";

  return (
    <header className="nav-wrap">
      <nav className="nav" aria-label="Main">
        <Link className="brand" to="/">
          <img src="/duck.svg" alt="dductly logo" className="brand-logo" />
          dductly
        </Link>
        <div className="menu">
          {!isImportPage ? (
            <>
              <a href="#services">Services</a>
              <Link to="/import">Import Data</Link>
              {/* hide subscriptions for now */}
              {/* <a href="#subscriptions">Subscriptions</a> */}
              <a href="#contact">Contact</a>
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              <Link to="/import">Import Data</Link>
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

const App: React.FC = () => (
  <div className="site">
    <Nav />
    <main>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/import" element={<Import />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

export default App;