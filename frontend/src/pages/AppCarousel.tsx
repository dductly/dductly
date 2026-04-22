import React, { useState, useEffect } from "react";

import appDashboard  from "../img/appdashboard.png";
import appExpense    from "../img/appexpense.png";
import appIncome     from "../img/appincome.png";
import appStats      from "../img/appstats.png";
import appAnalytics  from "../img/appanalytics.png";

const SLIDES = [
  { src: appDashboard, label: "Dashboard",  description: "Quick snapshot of your business: activity, totals, and key metrics all in one place." },
  { src: appExpense,   label: "Expenses",   description: "Log every expense with categories and vendors. See exactly where your money goes." },
  { src: appIncome,    label: "Income",     description: "Record all your revenue streams and keep your finances balanced." },
  { src: appStats,     label: "Stats",      description: "Visual breakdowns and insights to help you make smarter business decisions." },
  { src: appAnalytics, label: "Analytics",  description: "Dig deeper into your numbers with detailed analytics built for small businesses." },
];

const AppCarousel: React.FC = () => {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const go = (idx: number) => setActive((idx + SLIDES.length) % SLIDES.length);

  // Close lightbox on Escape key
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(active + 1);
      if (e.key === "ArrowLeft")  go(active - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, active]);

  return (
    <section className="app-carousel-section">
      <div className="app-carousel-card">
        <div className="app-carousel-card-bar" />

        {/* Left text */}
        <div className="app-carousel-text">
          <p className="app-carousel-eyebrow">Now on the App Store</p>
          <h2 className="app-carousel-heading">dductly in your pocket</h2>

          <div className="app-carousel-slide-info">
            <h3 className="app-carousel-slide-label">{SLIDES[active].label}</h3>
            <p className="app-carousel-slide-desc">{SLIDES[active].description}</p>
          </div>

          <div className="app-carousel-dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`app-carousel-dot${i === active ? " active" : ""}`}
                onClick={() => go(i)}
                aria-label={SLIDES[i].label}
              />
            ))}
          </div>

          <a
            href="https://apps.apple.com/us/app/dductly/id6761790510"
            target="_blank"
            rel="noopener noreferrer"
            className="app-store-badge"
            aria-label="Download on the App Store"
          >
            <img
              src="https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg"
              alt="Download on the App Store"
              className="app-store-img"
            />
          </a>
        </div>

        {/* Right: arrows + phone */}
        <div className="app-carousel-right">
          <button className="phone-arrow" onClick={() => go(active - 1)} aria-label="Previous">‹</button>

          <div className="phone-mockup" onClick={() => setLightbox(true)} title="Click to enlarge">
            <div className="phone-btn-vol-up" />
            <div className="phone-btn-vol-down" />
            <div className="phone-btn-power" />
            <div className="phone-notch" />
            <div className="phone-screen">
              {SLIDES.map((slide, i) => (
                <img
                  key={i}
                  src={slide.src}
                  alt={slide.label}
                  className={`phone-slide${i === active ? " active" : ""}`}
                />
              ))}
              <div className="phone-tap-hint">tap to expand</div>
            </div>
            <div className="phone-home-bar" />
          </div>

          <button className="phone-arrow" onClick={() => go(active + 1)} aria-label="Next">›</button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="carousel-lightbox" onClick={() => setLightbox(false)}>
          <button className="lightbox-arrow lightbox-arrow-left" onClick={e => { e.stopPropagation(); go(active - 1); }} aria-label="Previous">‹</button>

          <div className="lightbox-scroll-container" onClick={e => e.stopPropagation()}>
            <img
              src={SLIDES[active].src}
              alt={SLIDES[active].label}
              className="lightbox-image"
            />
          </div>

          <button className="lightbox-arrow lightbox-arrow-right" onClick={e => { e.stopPropagation(); go(active + 1); }} aria-label="Next">›</button>

          <button className="lightbox-close" onClick={() => setLightbox(false)}>×</button>
        </div>
      )}
    </section>
  );
};

export default AppCarousel;
