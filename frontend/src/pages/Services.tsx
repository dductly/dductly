import React from "react";
import meditateImg from "../img/meditate.png";
import coinsImg from "../img/coins.png";
import handImg from "../img/hand.png";

interface Service { title: string; subtext: string; img: string; }
const services: Service[] = [
  { title: "Track Expenses", subtext: "Easily log market booth fees, supplies, equipment, and other business expenses throughout the year.", img: handImg },
  { title: "Maximize Deductions", subtext: "Automatically categorize expenses and ensure you claim every eligible tax deduction for your farming business.", img: coinsImg },
  { title: "Simplify Taxes", subtext: "Generate organized reports and export data directly to your accountant or tax software for seamless filing.", img: meditateImg},
];

const Services: React.FC = () => (
  <section id="services" className="section">
    <h2 className="section-title">Everything you need to manage your farmers market business</h2>
    <p className="section-subtitle">From tracking daily expenses to maximizing tax deductions, dductly makes financial management simple and stress-free for farmers market vendors.</p>
    <div className="services-list">
      {services.map((s) => (
        <div className="service-item" key={s.title}>
          <img src={s.img} alt={s.title} className="service-image" />
          <h3 className="service-title">{s.title}</h3>
          <p className="service-subtext">{s.subtext}</p>
        </div>
      ))}
    </div>
  </section>
);

export default Services;
