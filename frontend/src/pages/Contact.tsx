// /Users/andreapinto/Documents/dductly/frontend/src/pages/Contact.tsx
import React, { useState } from "react";
import { sendContactEmail, type ContactFormData } from "../services/contactService";
import { useAuth } from "../hooks/useAuth";

interface ContactProps {
  onNavigate?: (page: string) => void;
}

const Contact: React.FC<ContactProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const result = await sendContactEmail(formData);
      
      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Thank you for your message! We\'ll get back to you soon.'
        });
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          message: "",
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Failed to send message. Please try again.'
        });
      }
    } catch {
      setSubmitStatus({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section contact">
      <div className="contact-left">
        <h2 className="section-title">Contact Us</h2>
        <p>Interested in using our service? Fill out some info and we will be in touch shortly. We can't wait to hear from you!</p>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        {submitStatus.type && (
          <div className={`contact-status ${submitStatus.type}`}>
            {submitStatus.message}
          </div>
        )}
        
        <label>Name <span className="req">(required)</span></label>
        <div className="row">
          <input 
            name="firstName"
            placeholder="First Name" 
            value={formData.firstName}
            onChange={handleInputChange}
            required 
            disabled={isSubmitting}
          />
          <input 
            name="lastName"
            placeholder="Last Name" 
            value={formData.lastName}
            onChange={handleInputChange}
            required 
            disabled={isSubmitting}
          />
        </div>
        <label>Email <span className="req">(required)</span></label>
        <input 
          name="email"
          type="email" 
          placeholder="you@example.com" 
          value={formData.email}
          onChange={handleInputChange}
          required 
          disabled={isSubmitting}
        />
        <label>Message <span className="req">(required)</span></label>
        <textarea 
          name="message"
          rows={6} 
          placeholder="How can we help?" 
          value={formData.message}
          onChange={handleInputChange}
          required 
          disabled={isSubmitting}
        />
        <button
          className="btn btn-primary"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send'}
        </button>
        {onNavigate && user && (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => onNavigate('home')}
            style={{ marginTop: '12px' }}
          >
            Back to Dashboard
          </button>
        )}
      </form>
    </section>
  );
};

export default Contact;