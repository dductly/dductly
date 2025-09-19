import React from "react";

const FAQs: React.FC = () => (
  <div className="page">
    <section className="section">
      <h1 className="section-title">Frequently Asked Questions</h1>
      <div className="faq-container">
        <div className="faq-item">
          <h3>What is dductly?</h3>
          <p>dductly is a platform that helps you track your charitable donations throughout the year, making it easier to maximize your tax deductions and stay organized during tax season.</p>
        </div>
        
        <div className="faq-item">
          <h3>How does dductly help with tax savings?</h3>
          <p>By tracking all your donations in one place, dductly ensures you don't miss any charitable contributions when filing your taxes. This helps you maximize your deductions and keep more money in your pocket.</p>
        </div>
        
        <div className="faq-item">
          <h3>Is my donation data secure?</h3>
          <p>Yes, we take data security seriously. All your donation information is encrypted and stored securely. We never share your personal data with third parties without your explicit consent.</p>
        </div>
        
        <div className="faq-item">
          <h3>Can I import donations from other platforms?</h3>
          <p>Currently, you can manually enter your donations. We're working on integration features to import donations from popular platforms and financial institutions.</p>
        </div>
        
        <div className="faq-item">
          <h3>What types of donations can I track?</h3>
          <p>You can track cash donations, non-cash donations, volunteer expenses, and other charitable contributions that are tax-deductible according to IRS guidelines.</p>
        </div>
        
        <div className="faq-item">
          <h3>How much does dductly cost?</h3>
          <p>We offer both Silver and Gold subscription plans. Check our subscription page for current pricing and features.</p>
        </div>
      </div>
    </section>
  </div>
);

export default FAQs;
