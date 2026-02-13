import React, { useState } from "react";
import expenseImg from "../img/expense.png";
import incomeImg from "../img/income.png";
import statsImg from "../img/stats.png";
import dashImg from "../img/dash.png";

interface Feature {
  title: string;
  description: string;
  img: string;
}

const features: Feature[] = [
  {
    title: "Your Dashboard",
    description: "Get a quick snapshot of your business with an overview of recent activity, totals, and key metrics all in one place.",
    img: dashImg,
  },
  {
    title: "Track Expenses",
    description: "Log every expense with categories, vendors, and payment methods. Stay on top of where your money goes with a clear, organized view.",
    img: expenseImg,
  },
  {
    title: "Manage Income",
    description: "Record all your income sources, from product sales to services. See exactly what's coming in and keep your finances balanced.",
    img: incomeImg,
  },
  {
    title: "View Your Stats",
    description: "Get a bird's-eye view of your finances with visual breakdowns and insights that help you make smarter business decisions.",
    img: statsImg,
  },
];

const Features: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const goTo = (index: number) => {
    setCurrent(index);
    setExpanded(false);
  };

  const prev = () => goTo(current === 0 ? features.length - 1 : current - 1);
  const next = () => goTo(current === features.length - 1 ? 0 : current + 1);

  return (
    <section id="features" className="section">
      <h2 className="section-title">See what dductly can do for you.</h2>
      <p className="section-subtitle">
        A simple, powerful financial tool designed to help small business owners and solo entrepreneurs stay organized and in control of their finances.
      </p>

      <div className="feature-carousel">
        <button className="carousel-arrow carousel-arrow-left" onClick={prev} aria-label="Previous">
          &#8249;
        </button>

        <div className="carousel-content">
          <div className="carousel-img-wrapper">
            <img
              src={features[current].img}
              alt={features[current].title}
              className="carousel-image"
              onClick={() => setExpanded(true)}
            />
          </div>
          <h3 className="carousel-title">{features[current].title}</h3>
          <p className="carousel-description">{features[current].description}</p>

          <div className="carousel-dots">
            {features.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === current ? "active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <button className="carousel-arrow carousel-arrow-right" onClick={next} aria-label="Next">
          &#8250;
        </button>
      </div>

      {expanded && (
        <div className="carousel-lightbox" onClick={() => setExpanded(false)}>
          <div className="lightbox-scroll-container" onClick={(e) => e.stopPropagation()}>
            <img
              src={features[current].img}
              alt={features[current].title}
              className="lightbox-image"
            />
          </div>
          <button className="lightbox-close" onClick={() => setExpanded(false)}>
            &times;
          </button>
        </div>
      )}
    </section>
  );
};

export default Features;
