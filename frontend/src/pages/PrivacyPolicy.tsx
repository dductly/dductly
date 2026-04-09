import React from "react";
import { LEGAL_LAST_UPDATED, PRIVACY_POLICY_SECTIONS } from "../constants/legal";
import LegalSectionRenderer from "../components/LegalSectionRenderer";

interface PrivacyPolicyProps {
  onNavigate?: (page: string) => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onNavigate }) => (
  <section className="section legal-page" aria-labelledby="privacy-policy-heading">
    <div className="legal-page-inner">
      <h1 id="privacy-policy-heading" className="section-title">
        Privacy Policy
      </h1>
      <div className="legal-page-body modal-body">
        <p>
          <strong>Last Updated:</strong> {LEGAL_LAST_UPDATED}
        </p>
        <LegalSectionRenderer sections={PRIVACY_POLICY_SECTIONS} />
        <p className="legal-page-support-link">
          <a
            href="/support"
            className="link"
            style={{ color: "var(--primary-purple)", fontWeight: 700, textDecoration: "none" }}
            onClick={(e) => {
              e.preventDefault();
              onNavigate?.("support");
            }}
          >
            Support
          </a>
          {" · "}
          <a
            href="/contact"
            className="link"
            style={{ color: "var(--primary-purple)", fontWeight: 700, textDecoration: "none" }}
            onClick={(e) => {
              e.preventDefault();
              onNavigate?.("contact");
            }}
          >
            Contact
          </a>
        </p>
      </div>
    </div>
  </section>
);

export default PrivacyPolicy;
