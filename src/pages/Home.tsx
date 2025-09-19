import React from "react";

const Home: React.FC = () => (
  <section id="home" className="hero">
    <div className="hero-left">
      <div className="kicker">introducing dductly</div>
      <h1>Turn everyday giving into real tax savings.</h1>
      <p className="sub">
        Our team at dductly aims to help you record donations in one place,
        turning everyday giving into real tax savings making tax season
        simple, secure, and stress-free.
      </p>
      <div className="cta-row">
        <a className="btn btn-primary" href="#subscriptions">Get Started</a>
        <a className="btn btn-ghost" href="#contact">Join the Waitlist</a>
      </div>
    </div>
    <figure className="hero-right" aria-label="Preview panel">
      <div className="panel-art" role="img" aria-label="Clean dark geometric panel" />
    </figure>
  </section>
);

export default Home;
