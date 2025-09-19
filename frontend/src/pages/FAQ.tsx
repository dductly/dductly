import React from 'react';

const FAQ: React.FC = () => {
  const faqs = [
    {
      question: "What is dductly?",
      answer: "dductly is a platform that provides various services to help streamline your workflow and improve productivity."
    },
    {
      question: "How do I get started?",
      answer: "Simply sign up for an account, choose a subscription plan that fits your needs, and start using our services."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers for our subscription plans."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, we offer a 14-day free trial for new users to explore our platform and services."
    }
  ];

  return (
    <section id="faq" className="section">
      <div className="container">
        <h1>Frequently Asked Questions</h1>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;