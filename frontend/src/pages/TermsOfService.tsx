import React from "react";
import { LEGAL_LAST_UPDATED, TERMS_OF_SERVICE_SECTIONS } from "../constants/legal";
import LegalSectionRenderer from "../components/LegalSectionRenderer";

interface TermsOfServiceProps {
  onNavigate?: (page: string) => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onNavigate }) => (
  <section className="section legal-page" aria-labelledby="terms-heading">
    <div className="legal-page-inner">
      <h1 id="terms-heading" className="section-title">
        Terms of Service
      </h1>
      <div className="legal-page-body modal-body">
        <p>
          <strong>Last Updated:</strong> {LEGAL_LAST_UPDATED}
        </p>
        <LegalSectionRenderer sections={TERMS_OF_SERVICE_SECTIONS} />
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
        </p>
      </div>
    </div>
  </section>
);

export default TermsOfService;
