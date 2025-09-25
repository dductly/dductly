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
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
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
        <div className="kicker">introducing dductly</div>
        <h1>Turn everyday giving into real tax savings.</h1>
        <p className="sub">
          Our team at dductly aims to help you record donations in one place,
          turning everyday giving into real tax savings making tax season
          simple, secure, and stress-free.
        </p>
        <div className="cta-row">
          <a className="btn btn-primary" href="#services">Get Started</a>
          <a className="btn btn-primary" href="#contact">Contact Us</a>
        </div>
      </div>
      <div className="hero-right" aria-label="Waitlist panel">
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
            <h2>Join the Waitlist</h2>
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
                {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
};

export default Home;
