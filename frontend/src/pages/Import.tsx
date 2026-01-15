import React, { useEffect, useState } from "react";
import CSVUpload from "../components/CSVUpload";
import { supabase } from "../lib/supabaseClient";

interface ImportProps {
  onNavigate?: (page: string) => void;
}

const Import: React.FC<ImportProps> = ({ onNavigate }) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name || user.email;
        setUserName(name || 'Unknown User');
      }
    };
    fetchUser();
  }, []);

  const handleEmailSuccess = (fileName: string) => {
    setSuccessMessage(`File "${fileName}" uploaded! Your data has been sent for processing.`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <section id="import" className="section import-section">
      {onNavigate && (
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back to Dashboard
        </button>
      )}
      <div className="import-header">
        <h2 className="section-title">Import Your Records</h2>
        <p className="section-subtitle">
          Upload your existing bookkeeping data from Excel or CSV files. We'll
          help you organize it beautifully and save it to your account.
        </p>
      </div>

      <CSVUpload 
        userName={userName}
        onEmailSuccess={handleEmailSuccess}
      />

      {successMessage && (
        <div className={'save-message success'}>{successMessage}</div>
      )}

      {!successMessage && (
        <div className="import-help">
          <h3>Need help formatting your spreadsheet?</h3>
          <p>Your CSV or Excel file should include columns like:</p>
          <ul>
            <li>Date - When the donation was made</li>
            <li>Recipient - Organization or person who received the donation</li>
            <li>Amount - Dollar amount of the donation</li>
            <li>Category - Type of donation (optional)</li>
            <li>Description - Additional notes (optional)</li>
          </ul>
          <p className="help-note">
            Don't worry if your columns have different names - we'll do our best
            to figure it out!
          </p>
        </div>
      )}
    </section>
  );
};

export default Import;
