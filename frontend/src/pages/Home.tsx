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
        <div className="kicker">Built for business Owners</div>
        <h1>Making your life easier, one expense at a time.</h1>
        <p className="sub">
          At dductly, we believe small businesses are the heart of every community. Our mission is to simplify the day-to-day of running a business, so you can focus on what matters most: your customers, your growth, and doing what you love.
        </p>
        <div className="cta-row">
          <button className="btn btn-primary btn-cta" onClick={() => onNavigate?.('signup')}>Sign Up Now</button>
          <button className="btn btn-primary" onClick={() => window.location.href = '#contact'}>Contact Us</button>
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
                  <span className="yearly-label">{STANDARD_SUBSCRIPTION_CARD.monthly.billingLabel}</span>
                </div>
                <div className="pricing-option yearly">
                  <span className="price">{STANDARD_SUBSCRIPTION_CARD.yearly.price}</span>
                  <span className="price-period">{STANDARD_SUBSCRIPTION_CARD.yearly.period}</span>
                  <span className="yearly-label">{STANDARD_SUBSCRIPTION_CARD.yearly.billingLabel}</span>
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
