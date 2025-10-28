import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const Home: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Attempting to submit form data:', formData);
      
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_PUBLIC_KEY;

      console.log('Environment check:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlValue: supabaseUrl,
        urlLength: supabaseUrl?.length,
        keyLength: supabaseKey?.length,
        isPlaceholder: supabaseUrl?.includes('placeholder'),
        allEnvVars: Object.keys(import.meta.env)
      });
      console.log('Testing with updated env vars');
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
        console.log('Supabase not configured, simulating success for demo');
        // Simulate successful submission for demo purposes
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        const { error } = await supabase
          .from('waitlist')
          .insert([
            {
              name: formData.fullName,
              phone: formData.phone,
              email: formData.email
            }
          ]);

        if (error) {
          console.error('Supabase error:', error);
          alert(`Error adding to waitlist: ${error.message}`);
          return;
        }
      }

      console.log('Successfully added to waitlist!');

      setShowSuccess(true);
      setFormData({
        fullName: '',
        phone: '',
        email: ''
      });
    } catch (err) {
      console.error('Error:', err);
      alert('There was an error adding you to the waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="home" className="hero">
      <div className="hero-left">
        <div className="bubble-1"></div>
        <div className="bubble-2"></div>
        <div className="kicker">Built for Farmers Market Vendors</div>
        <h1>Making market life easier, one expense at a time.</h1>
        <p className="sub">
          At dductly we believe thriving markets build thriving communities. Our mission is to make running your business effortless so you can focus on what matters most: growing your craft and connecting with your community.
        </p>
        <div className="cta-row">
          <a className="btn btn-primary" href="#services">Get Started</a>
          <a className="btn btn-primary" href="#contact">Contact Us</a>
        </div>
      </div>
      <div className="hero-right" aria-label="Waitlist panel">
        <div className="bubble-1"></div>
        <div className="bubble-2"></div>
        {showSuccess ? (
          <div className="waitlist-success">
            <h2>Thank you for your interest!</h2>
            <p>You have been added to the waitlist. We will keep you posted on further developments!</p>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowSuccess(false)}
            >
              Add Another Person
            </button>
          </div>
        ) : (
          <div className="waitlist-form-container">
            <h2>Start Your Free Trial</h2>
            <p>Take the stress out of managing your business, we'll handle the details!</p>
            <form onSubmit={handleSubmit} className="waitlist-form">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Starting Trial...' : 'Start Free Trial'}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};

export default Home;
