import React, { useState } from "react";
import CSVUpload from "../components/CSVUpload";
import DataTable from "../components/DataTable";
import { supabase } from "../lib/supabaseClient";

interface DonationRecord {
  date?: string;
  recipient?: string;
  amount?: string | number;
  category?: string;
  description?: string;
  [key: string]: string | number | undefined;
}

const Import: React.FC = () => {
  const [importedData, setImportedData] = useState<DonationRecord[]>([]);
  const [showFullTable, setShowFullTable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleDataParsed = (data: DonationRecord[]) => {
    // Filter out empty rows
    const filteredData = data.filter((row) =>
      Object.values(row).some((value) => value !== undefined && value !== "")
    );
    setImportedData(filteredData);
    setShowFullTable(false); // Reset to preview mode
    setSaveMessage(null);
  };

  const handleViewAll = () => {
    setShowFullTable(true);
  };

  const handleSaveToDatabase = async (data: DonationRecord[]) => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_PUBLIC_KEY;

      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) {
        // Simulate saving for demo
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setSaveMessage({
          type: "success",
          text: `Successfully saved ${data.length} records! (Demo mode - Supabase not configured)`,
        });
      } else {
        // Transform data to match your database schema
        const recordsToInsert = data.map((record) => ({
          date: record.date || new Date().toISOString(),
          recipient: record.recipient || record.Recipient || "",
          amount: parseFloat(String(record.amount || record.Amount || 0)),
          category: record.category || record.Category || "Donation",
          description: record.description || record.Description || "",
        }));

        const { error } = await supabase.from("donations").insert(recordsToInsert);

        if (error) {
          console.error("Supabase error:", error);
          setSaveMessage({
            type: "error",
            text: `Error saving to database: ${error.message}`,
          });
        } else {
          setSaveMessage({
            type: "success",
            text: `Successfully saved ${data.length} records to your account!`,
          });
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setSaveMessage({
        type: "error",
        text: "An unexpected error occurred while saving.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section id="import" className="section import-section">
      <div className="import-header">
        <h2 className="section-title">Import Your Records</h2>
        <p className="section-subtitle">
          Upload your existing bookkeeping data from Excel or CSV files. We'll
          help you organize it beautifully and save it to your account.
        </p>
      </div>

      <CSVUpload onDataParsed={handleDataParsed} />

      {saveMessage && (
        <div className={`save-message ${saveMessage.type}`}>
          {saveMessage.text}
        </div>
      )}

      {importedData.length > 0 && !showFullTable && (
        <div className="import-preview">
          <div className="preview-header">
            <h3>Upload Successful!</h3>
            <p className="preview-info">
              Loaded {importedData.length} records. Here's a preview of the first 3 rows:
            </p>
          </div>
          <DataTable
            data={importedData.slice(0, 3)}
            onSave={isSaving ? undefined : () => handleSaveToDatabase(importedData)}
          />
          <div className="preview-actions">
            <button className="btn btn-primary" onClick={handleViewAll}>
              View All {importedData.length} Records
            </button>
          </div>
        </div>
      )}

      {importedData.length > 0 && showFullTable && (
        <div className="imported-data-section">
          <div className="collapse-section">
            <button
              className="btn btn-secondary btn-small"
              onClick={() => setShowFullTable(false)}
            >
              ← Collapse to Preview
            </button>
          </div>
          <DataTable
            data={importedData}
            onSave={isSaving ? undefined : handleSaveToDatabase}
          />
        </div>
      )}

      {importedData.length === 0 && (
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
