import React from "react";
import type { LegalSection } from "../constants/legal";

interface LegalSectionRendererProps {
  sections: LegalSection[];
}

const LegalSectionRenderer: React.FC<LegalSectionRendererProps> = ({ sections }) => (
  <>
    {sections.map((section) => (
      <React.Fragment key={section.title}>
        <h3>{section.title}</h3>
        {section.paragraphs.map((p, i) => (
          <p key={`${section.title}-p-${i}`}>{p}</p>
        ))}
        {section.listItems && section.listItems.length > 0 && (
          <ul>
            {section.listItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </React.Fragment>
    ))}
  </>
);

export default LegalSectionRenderer;
