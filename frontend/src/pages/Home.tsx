import React, { useState, useEffect } from "react";

interface HomeProps {
  onNavigate?: (page: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const FREE_TIER_LIMIT = 100;

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        // Get user count from backend API (most secure approach)
        // This endpoint is public and accessible to anonymous/logged-out users
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/user-count`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const count = data.count || 0;
          console.log('User count fetched successfully:', count);
          setUserCount(count);
        } else {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          console.error('Failed to fetch user count:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          // Still show 0 if we get an error, so the counter shows something
          setUserCount(0);
        }
      } catch (error) {
        console.error('Error fetching user count:', error);
        // Network error or backend not running - show 0 as fallback
        setUserCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCount();
  }, []);

  const spotsRemaining = userCount !== null ? FREE_TIER_LIMIT - userCount : null;
  const isFull = userCount !== null && userCount >= FREE_TIER_LIMIT;
  const isGoldAvailable = userCount !== null && userCount >= FREE_TIER_LIMIT;

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
        <div className="cta-row" style={{ display: 'flex', gap: '16px' }}>
          <button className="btn btn-primary" onClick={() => onNavigate?.('signup')} style={{ width: '180px', padding: '16px 32px', textAlign: 'center', fontSize: '1.1rem' }}>Get Started</button>
          <button className="btn btn-primary" onClick={() => window.location.href = '#contact'} style={{ width: '180px', padding: '16px 32px', textAlign: 'center', fontSize: '1.1rem' }}>Contact Us</button>
        </div>
      </div>
      <div className="hero-right" aria-label="Subscription plans">
        <div className="bubble-1"></div>
        <div className="bubble-2"></div>
        <div className="subscription-info-container">
          <h2>Our Subscription Plans</h2>
          <p>Simple, affordable pricing to help you manage your business finances without breaking the bank.</p>
          <div className="subscription-plans">
            <div className="subscription-plan">
              <h3>Free for Life</h3>
              <p>Be one of the first 100 people to sign up and get unlimited access to expense tracking, income management, financial reporting, and advanced analytics — everything you need to stay organized all year, completely free forever.</p>
              <div className="signup-counter">
                {loading ? (
                  <span className="counter-text">Loading...</span>
                ) : userCount !== null ? (
                  <>
                    <div className="counter-numbers">
                      <span className="counter-number">{userCount}</span>
                      <span className="counter-separator">/</span>
                      <span className="counter-total">{FREE_TIER_LIMIT}</span>
                    </div>
                    <span className="counter-label">people signed up</span>
                    {isFull ? (
                      <span className="counter-status full">Free tier is full</span>
                    ) : spotsRemaining !== null && spotsRemaining <= 10 ? (
                      <span className="counter-status warning">Only {spotsRemaining} spots left!</span>
                    ) : null}
                  </>
                ) : (
                  <span className="counter-text">Sign up now to secure your free spot!</span>
                )}
              </div>
              <button className="btn btn-primary btn-small" onClick={() => onNavigate?.('signup')}>Sign Up for Free</button>
            </div>
            <div className={`subscription-plan ${!isGoldAvailable ? 'disabled' : ''}`}>
              <h3>Standard Subscription</h3>
              <p>Unlimited access to expense tracking, income management, financial reporting, and advanced analytics — everything you need to stay organized all year.</p>
              <div className="subscription-pricing">
                <div className="pricing-option">
                  <span className="price">$7</span>
                  <span className="price-period">/ month</span>
                  <span className="yearly-label">(billed monthly)</span>
                </div>
                <div className="pricing-option yearly">
                  <span className="price">$5</span>
                  <span className="price-period">/ month</span>
                  <span className="yearly-label">(billed yearly)</span>
                </div>
              </div>
              {!isGoldAvailable && (
                <div className="availability-notice">
                  Available after {FREE_TIER_LIMIT} users sign up
                </div>
              )}
              {isGoldAvailable ? (
                <a className="btn btn-primary btn-small" href="#contact">Learn More</a>
              ) : (
                <span className="btn btn-primary btn-small disabled">Coming Soon</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
