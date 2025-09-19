import React from "react";
import meditateImg from "../img/meditate.png";
import coinsImg from "../img/coins.png";
import handImg from "../img/hand.png";

interface Service { title: string; subtext: string; img: string; }
const services: Service[] = [
  { title: "Track Savings", subtext: "See your donations add up all year long. Every dollar you donate is captured in one place.", img: handImg },
  { title: "Save Money", subtext: "Maximize your deductions and keep more in your pocket when tax season arrives.", img: coinsImg },
  { title: "Stress Less", subtext: "Compile the year's donations into a clean report for your accountant or tax software.", img: meditateImg},
];

const Services: React.FC = () => (
  <section id="services" className="section">
    <h2 className="section-title">Maximize savings. Minimize hassle.</h2>
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
