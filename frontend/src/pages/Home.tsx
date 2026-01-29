import React from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState, useRef } from 'react';

interface HomeProps {
  onNavigate?: (page: string) => void;
}

const UserCountRealtime: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchCount = async () => {
    try {
      // Use Supabase RPC to call the database function directly
      // This avoids CORS issues and is the recommended approach
      const { data, error } = await supabase.rpc('get_user_count');
      
      if (error) {
        console.error('Failed to fetch user count:', error);
        setError(true);
        setCount(0);
        return;
      }
      
      // The RPC function returns an integer directly
      const countValue = typeof data === 'number' ? data : 0;
      setCount(countValue);
      setError(false);
    } catch (err: unknown) {
      console.error('UserCount fetch error', err);
      setError(true);
      // Set a default count if fetch fails to prevent breaking the UI
      setCount(0);
    }
  };

  useEffect(() => {
    fetchCount();

    try {
      // Create a channel for user events; config.broadcast.self true lets the sender also receive the broadcast
      const channel = supabase.channel('public:user-events', { 
        config: { broadcast: { self: true } } 
      });
      channelRef.current = channel;

      // Listen to the broadcast event 'user_signed_in'
      channel.on('broadcast', { event: 'user_signed_in' }, () => {
        fetchCount();
      });

      // Subscribe
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

  // Show loading state
  if (count === null && !error) {
    return <span className="counter-text" style={{ color: 'var(--deep-blue)', fontSize: '2.5rem', fontWeight: 'bold' }}>Loading…</span>;
  }
  
  // Show count or fallback in blue
  return (
    <span className="counter-text" style={{ color: 'var(--deep-blue)', fontSize: '2.5rem', fontWeight: 'bold' }}>
      {count ?? 0} / 100
    </span>
  );
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const FREE_TIER_LIMIT = 100;

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
                <UserCountRealtime />
              </div>
              <button className="btn btn-primary btn-small" onClick={() => onNavigate?.('signup')}>Sign Up for Free</button>
            </div>
            <div className="subscription-plan disabled">
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
              <div className="availability-notice">
                Available after {FREE_TIER_LIMIT} users sign up
              </div>
              <span className="btn btn-primary btn-small disabled">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
