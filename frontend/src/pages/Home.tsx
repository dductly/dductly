import React from "react";
import { STANDARD_SUBSCRIPTION_CARD, SUBSCRIPTION_PLANS_SECTION } from "../constants/subscriptionMarketing";

interface HomeProps {
  onNavigate?: (page: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <section id="home" className="hero">
      <div className="hero-left">
        <div className="bubble-1"></div>
        <div className="bubble-2"></div>
        <div className="kicker-row">
          <div className="kicker">Built for business Owners</div>
          <a
            href="https://apps.apple.com/us/app/dductly/id6761790510"
            target="_blank"
            rel="noopener noreferrer"
            className="app-store-badge"
            aria-label="Download on the App Store"
          >
            <img
              src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg"
              alt="Download on the App Store"
              className="app-store-img"
            />
          </a>
        </div>
        <h1>Making your life easier, one expense at a time.</h1>
        <p className="sub">
          At dductly, we believe small businesses are the heart of every community. Our mission is to simplify the day-to-day of running a business, so you can focus on what matters most: your customers, your growth, and doing what you love.
        </p>
        <div className="cta-row">
          <button className="btn btn-primary btn-cta" onClick={() => onNavigate?.('signup')}>Sign Up Now</button>
          <button className="btn btn-primary" onClick={() => window.location.href = '#contact'}>Contact Us</button>
          <div className="social-links">
            <a
              href="https://www.instagram.com/dductly/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
              aria-label="Follow us on Instagram"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
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
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="hero-right" aria-label="Subscription plans">
        <div className="bubble-1"></div>
        <div className="bubble-2"></div>
        <div className="subscription-info-container">
          <h2>{SUBSCRIPTION_PLANS_SECTION.title}</h2>
          <p>{SUBSCRIPTION_PLANS_SECTION.subtitle}</p>
          <div className="subscription-plans">
            <div className="subscription-plan">
              <h3>Free for Life</h3>
              <p>Thank you to our initial users for signing up — you’re helping us shape dductly.</p>
            </div>
            <div className="subscription-plan disabled">
              <h3>{STANDARD_SUBSCRIPTION_CARD.title}</h3>
              <div className="subscription-pricing">
                <div className="pricing-option">
                  <span className="price">{STANDARD_SUBSCRIPTION_CARD.monthly.price}</span>
                  <span className="price-period">{STANDARD_SUBSCRIPTION_CARD.monthly.period}</span>
                </div>
                <div className="pricing-option yearly">
                  <span className="price">{STANDARD_SUBSCRIPTION_CARD.yearly.price}</span>
                  <span className="price-period">{STANDARD_SUBSCRIPTION_CARD.yearly.period}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={() => onNavigate?.('signup')}
              >
                Sign up now
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
