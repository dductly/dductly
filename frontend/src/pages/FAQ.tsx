import React, { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "How does dductly help me save money on taxes?",
    answer: "dductly automatically tracks all your charitable donations throughout the year, ensuring you don't miss any tax-deductible contributions. When tax season arrives, you'll have a comprehensive report ready for your accountant or tax software, maximizing your deductions and reducing your tax burden."
  },
  {
    question: "What types of donations can I track with dductly?",
    answer: "You can track cash donations, non-cash donations (clothing, household items, etc.), volunteer expenses, and even mileage for charitable activities. Our platform is designed to capture all forms of charitable giving that qualify for tax deductions."
  },
  {
    question: "Is my donation data secure and private?",
    answer: "Absolutely. We use bank-level encryption to protect your financial data and never share your personal information with third parties. Your donation records are stored securely and only accessible to you."
  },
  {
    question: "How do I get started with dductly?",
    answer: "Simply join our waitlist on the home page, and we'll notify you as soon as dductly becomes available. Once launched, you'll be able to create an account and start tracking your donations immediately."
  },
  {
    question: "Will dductly integrate with my existing tax software?",
    answer: "Yes, we're building integrations with major tax software platforms like TurboTax, H&R Block, and others. You'll be able to export your donation records directly into your preferred tax preparation software."
  },
  {
    question: "How much does dductly cost?",
    answer: "We're still finalizing our pricing structure, but we're committed to making tax savings accessible to everyone. Join our waitlist to be the first to know about our launch pricing and special early adopter discounts."
  },
  {
    question: "Can I use dductly for multiple tax years?",
    answer: "Yes, dductly maintains your donation history across multiple tax years, making it easy to reference past donations and track your giving patterns over time."
  },
  {
    question: "What if I make a mistake entering a donation?",
    answer: "No problem! dductly allows you to easily edit or delete donation entries. You can also add notes and receipts to each donation for better record-keeping and accuracy."
  }
];

const FAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <main>
      <section id="faq" className="section">
        <div className="faq-header">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="faq-subtitle">
            Everything you need to know about dductly and how we can help you maximize your tax savings.
          </p>
        </div>
        
        <div className="faq-container">
          {faqData.map((item, index) => (
            <div key={index} className="faq-item">
              <button
                className="faq-question"
                onClick={() => toggleItem(index)}
                aria-expanded={openItems.has(index)}
              >
                <span>{item.question}</span>
                <span className="faq-icon">
                  {openItems.has(index) ? '−' : '+'}
                </span>
              </button>
              {openItems.has(index) && (
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="faq-cta">
          <h3>Still have questions?</h3>
          <p>Can't find what you're looking for? We're here to help!</p>
          <a className="btn btn-primary" href="/#contact">Contact Us</a>
        </div>
      </section>
    </main>
  );
};

export default FAQ;
