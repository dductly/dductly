import React from "react";

const plans = [
  { name: "Silver Subscription", desc: "Unlimited access to essential tax forms and tools — everything you need to stay organized all year." },
  { name: "Gold Subscription", desc: "All the benefits of Silver, plus our AI Tax Tutor for smart guidance, faster answers, and less stress." },
];

const Subscriptions: React.FC = () => (
  <section id="subscriptions" className="section">
    <h2 className="section-title">Join the Waitlist</h2>
    <div className="subs-grid">
      {plans.map((p) => (
        <div className="sub-item" key={p.name}>
          <div className="sub-card">
            <h3>{p.name}</h3>
            <p>{p.desc}</p>
            <a className="btn btn-primary btn-small" href="#contact">Join the Waitlist</a>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default Subscriptions;
