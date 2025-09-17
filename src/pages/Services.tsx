import React from "react";

interface Service { title: string; subtext: string; img: string; }
const services: Service[] = [
  { title: "Track Savings", subtext: "See your donations and write-offs add up all year long — no last-minute scramble." ,img: "/img/service-1.jpg" },
  { title: "Save Money", subtext: "Maximize deductions and keep more in your pocket when tax season rolls around.", img: "/img/service-2.jpg" },
  { title: "Stress Less", subtext: "One place, one click — a smoother tax season without the headaches.", img: "/img/service-3.jpg" },
];

const Services: React.FC = () => (
  <section id="services" className="section">
    <h2 className="section-title">Our Services</h2>
    <div className="services-list">
      {services.map((s) => (
        <div className="service-item" key={s.title}>
          <h3 className="service-title">{s.title}</h3>
          <p className="service-subtext">{s.subtext}</p>
        </div>
      ))}
    </div>
  </section>
);

export default Services;
