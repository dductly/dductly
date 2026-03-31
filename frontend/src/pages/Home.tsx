import React from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState, useRef } from "react";
import { STANDARD_SUBSCRIPTION_CARD, SUBSCRIPTION_PLANS_SECTION } from "../constants/subscriptionMarketing";

interface HomeProps {
  onNavigate?: (page: string) => void;
}

const UserCountRealtime: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchCount = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_count');

      if (error) {
        console.error('Failed to fetch user count:', error);
        setError(true);
        setCount(0);
        return;
      }

      const countValue = typeof data === 'number' ? data : 0;
      setCount(countValue);
      setError(false);
    } catch (err: unknown) {
      console.error('UserCount fetch error', err);
      setError(true);
      setCount(0);
    }
  };

  useEffect(() => {
    fetchCount();

    try {
      const channel = supabase.channel('public:user-events', {
        config: { broadcast: { self: true } }
      });
      channelRef.current = channel;

      channel.on('broadcast', { event: 'user_signed_in' }, () => {
        fetchCount();
      });

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to user-events channel');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel subscription error');
        }
      });
    } catch (err) {
      console.error('Failed to set up realtime channel:', err);
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  if (count === null && !error) {
    return <span className="counter-text" style={{ color: 'var(--deep-blue)', fontSize: '2.5rem', fontWeight: 'bold' }}>Loading…</span>;
  }

  return (
    <span className="counter-text" style={{ color: 'var(--deep-blue)', fontSize: '2.5rem', fontWeight: 'bold' }}>
      {count ?? 0} / 50
    </span>
  );
};

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const FREE_TIER_LIMIT = 50;

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
