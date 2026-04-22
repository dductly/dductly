import React, { useState } from "react";
import expenseImg from "../img/expense.png";
import incomeImg from "../img/income.png";
import statsImg from "../img/stats.png";
import dashImg from "../img/dash.png";
import importRecordsImg from "../img/import-records.png";
import keyDeadlinesImg from "../img/key-deadlines.png";
import settingsImg from "../img/settings.png";
import taxSnapshotImg from "../img/tax-snapshot.png";
import writeOffGuideImg from "../img/write-off-guide.png";
import websiteMileageImg from "../img/websitemileage.png";

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
  {
    title: "Tax Insights Overview",
    description: "See your revenue, deductible expenses, and taxable net profit at a glance so you're always prepared for tax season.",
    img: taxSnapshotImg,
  },
  {
    title: "Write-Off Guide",
    description: "Explore common deductible categories with plain-language tips so you know exactly what business costs you can write off.",
    img: writeOffGuideImg,
  },
  {
    title: "Key Tax Deadlines",
    description: "Stay on top of quarterly estimated payments and annual filing dates with a clear timeline of upcoming deadlines.",
    img: keyDeadlinesImg,
  },
  {
    title: "Import Your Records",
    description: "Upload your existing bookkeeping data from CSV or Excel so you can get organized fast without starting from scratch.",
    img: importRecordsImg,
  },
  {
    title: "Settings & Preferences",
    description: "Customize your account details, security, and preferences like dark mode so dductly works the way you do.",
    img: settingsImg,
  },
  {
    title: "Mileage Tracker",
    description: "Log every business trip and we automatically calculate your deductible using the IRS standard mileage rate. No math required.",
    img: websiteMileageImg,
  },
];

const Features: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const goTo = (index: number) => {
    setCurrent((index + features.length) % features.length);
    setExpanded(false);
  };

  // Navigate without closing the lightbox
  const lightboxNav = (index: number) => {
    setCurrent((index + features.length) % features.length);
  };

  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  return (
    <section id="features" className="app-carousel-section">
      <div className="app-carousel-card">
        <div className="app-carousel-card-bar" />

        {/* Left text — same structure as AppCarousel */}
        <div className="app-carousel-text">
          <p className="app-carousel-eyebrow">dductly on the web</p>
          <h2 className="app-carousel-heading">See what dductly can do for you.</h2>

          <div className="app-carousel-slide-info">
            <h3 className="app-carousel-slide-label">{features[current].title}</h3>
            <p className="app-carousel-slide-desc">{features[current].description}</p>
          </div>

          <div className="app-carousel-dots">
            {features.map((_, i) => (
              <button
                key={i}
                className={`app-carousel-dot${i === current ? " active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right: arrows + screenshot frame */}
        <div className="app-carousel-right">
          <button className="phone-arrow" onClick={prev} aria-label="Previous">‹</button>

          <div className="mockup-with-hint">
            <div className="browser-mockup" onClick={() => setExpanded(true)} title="Click to expand" style={{ cursor: "pointer" }}>
              <div className="browser-bar">
                <div className="browser-dots">
                  <span className="browser-dot dot-red" />
                  <span className="browser-dot dot-yellow" />
                  <span className="browser-dot dot-green" />
                </div>
                <div className="browser-url">dductly.com</div>
              </div>
              <div className="browser-screen">
                <img
                  key={current}
                  src={features[current].img}
                  alt={features[current].title}
                  className="browser-screenshot"
                />
              </div>
            </div>
            <p className="mockup-tap-hint">tap to expand</p>
          </div>

          <button className="phone-arrow" onClick={next} aria-label="Next">›</button>
        </div>
      </div>

      {/* Lightbox — same as AppCarousel */}
      {expanded && (
        <div className="carousel-lightbox" onClick={() => setExpanded(false)}>
          <button className="lightbox-arrow lightbox-arrow-left" onClick={e => { e.stopPropagation(); lightboxNav(current - 1); }} aria-label="Previous">‹</button>

          <div className="lightbox-scroll-container" onClick={e => e.stopPropagation()}>
            <img
              src={features[current].img}
              alt={features[current].title}
              className="lightbox-image lightbox-image-web"
            />
          </div>

          <button className="lightbox-arrow lightbox-arrow-right" onClick={e => { e.stopPropagation(); lightboxNav(current + 1); }} aria-label="Next">›</button>

          <button className="lightbox-close" onClick={() => setExpanded(false)}>×</button>
        </div>
      )}
    </section>
  );
};

export default Features;
