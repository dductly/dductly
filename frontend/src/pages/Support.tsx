import React from "react";

const FEATURE_REQUEST_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScOYlWOBMu0o1gCc6GWutx24KVRdYntrBPdJ0xpYSK73U5Jjg/viewform?usp=header";

interface SupportProps {
  onNavigate?: (page: string) => void;
}

const Support: React.FC<SupportProps> = ({ onNavigate }) => (
  <section className="section legal-page" aria-labelledby="support-heading">
    <div className="legal-page-inner">
      <h1 id="support-heading" className="section-title">
        Support
      </h1>
      <div className="legal-page-body modal-body">
        <h3>Get help</h3>
        <p>
          For help with your account, billing, or using dductly, send a message through our contact form. We typically
          respond within 24 hours on business days.
        </p>
        <p>
          <a
            href="/contact"
            className="link"
            style={{ color: "var(--primary-purple)", fontWeight: 700, textDecoration: "none" }}
            onClick={(e) => {
              e.preventDefault();
              onNavigate?.("contact");
            }}
          >
            Contact us
          </a>
        </p>

        <h3>Request a feature</h3>
        <p>
          Have an idea to make dductly better? Tell us what you&apos;d like to see—we read every submission. We may
          reach out with follow-up questions to understand your request.
        </p>
        <p>
          <a
            href={FEATURE_REQUEST_FORM_URL}
            className="link"
            style={{ color: "var(--primary-purple)", fontWeight: 700, textDecoration: "none" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open feature request form
          </a>
        </p>
      </div>
    </div>
  </section>
);

export default Support;
