import React from "react";
import stocksImg from "../img/stocks.svg";
import shoppingbasketImg from "../img/shoppingbasket.svg";
import storefrontImg from "../img/storefront.svg";

interface Service { title: string; subtext: string; img: string; }
const services: Service[] = [
  { title: "Your Business", subtext: "Easily track your expenses, from supplies to operating costs, all in one simple place designed for small businesses like you.", img: storefrontImg },
  { title: "Your Finances", subtext: "Stay organized with automatic expense sorting and clear insights that help your business thrive every day.", img: shoppingbasketImg },
  { title: "Made Effortless", subtext: "Export everything you need at tax time with just a click, giving you peace of mind and more time for your craft and community.", img: stocksImg},
];

const Services: React.FC = () => (
  <section id="services" className="section">
    <h2 className="section-title">Simplify your business and focus on what you love.</h2>
    <p className="section-subtitle">Built for small business owners, dductly helps you spend less time on bookkeeping and more time doing what you love: creating, connecting, and growing your business.</p>
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
