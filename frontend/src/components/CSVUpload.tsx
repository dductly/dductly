import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface CSVUploadProps {
  userName: string | null;
  onEmailSuccess: (fileName: string) => void;
}

interface PreviewData {
  headers: string[];
  rows: string[][];
  file: File;
}

const CSVUpload: React.FC<CSVUploadProps> = ({ userName, onEmailSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // Parse CSV file
  const parseCSV = (file: File): Promise<PreviewData> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => {
          const data = results.data as string[][];
          if (data.length === 0) {
            reject(new Error("File is empty"));
            return;
          }
          resolve({
            headers: data[0] || [],
            rows: data.slice(1).filter(row => row.some(cell => cell.trim() !== "")),
            file,
          });
        },
        error: (err) => reject(err),
      });
    });
  };

  // Parse Excel file
  const parseExcel = (file: File): Promise<PreviewData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

          if (jsonData.length === 0) {
            reject(new Error("File is empty"));
            return;
          }

          resolve({
            headers: jsonData[0] || [],
            rows: jsonData.slice(1).filter(row => row.some(cell => cell && String(cell).trim() !== "")),
            file,
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsBinaryString(file);
    });
  };

  // --- Helper: convert File -> base64 (strip prefix) and send to Supabase function
  const sendFileToEmail = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          // reader.result will be like "data:application/octet-stream;base64,AAAA..."
          const result = reader.result as string;
          const base64 = result.split(",")[1]; // strip data:<mime>;base64, prefix

          // Build function URL from env var
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
          const anonKey = import.meta.env.VITE_SUPABASE_ANON_PUBLIC_KEY  as string;

          if (!supabaseUrl || !anonKey) {
            throw new Error("Missing Supabase environment variables.");
          }

          const res = await fetch(`${supabaseUrl}/functions/v1/send-upload-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              fileContent: base64,
              fileName: file.name,
              fileType: file.type,
              userName: userName,
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Function error: ${text || res.status}`);
          }

          onEmailSuccess(file.name);

          resolve();
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setError("");
    setFileName(file.name);
    setPreviewData(null);

    try {
      let parsed: PreviewData;

      if (file.name.endsWith(".csv")) {
        parsed = await parseCSV(file);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        parsed = await parseExcel(file);
      } else {
        throw new Error("Unsupported file format. Please use CSV or Excel files.");
      }

      setPreviewData(parsed);
      setIsLoading(false);
    } catch (err) {
      console.error("Error parsing file:", err);
      setError(
        (err instanceof Error && err.message) ||
          "Failed to parse file."
      );
      setIsLoading(false);
    }
  };

  const handleConfirmSend = async () => {
    if (!previewData) return;

    setIsLoading(true);
    setError("");

    try {
      await sendFileToEmail(previewData.file);
      setPreviewData(null);
      setFileName("");
    } catch (err) {
      console.error("Error sending file to email function:", err);
      setError(
        (err instanceof Error && err.message) ||
          "Failed to send file to email function."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPreviewData(null);
    setFileName("");
    setError("");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  // Show preview table if data is available
  if (previewData) {
    const maxPreviewRows = 10;
    const displayRows = previewData.rows.slice(0, maxPreviewRows);
    const hasMoreRows = previewData.rows.length > maxPreviewRows;

    return (
      <div className="csv-upload-container">
        <div className="preview-container">
          <div className="preview-header">
            <h3>Review Your Data</h3>
            <p className="preview-subtitle">
              Please review the data below before submitting. Showing {displayRows.length} of {previewData.rows.length} rows.
            </p>
          </div>

          <div className="preview-table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  {previewData.headers.map((header, index) => (
                    <th key={index}>{header || `Column ${index + 1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {previewData.headers.map((_, colIndex) => (
                      <td key={colIndex}>{row[colIndex] || ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMoreRows && (
            <p className="preview-more-rows">
              ...and {previewData.rows.length - maxPreviewRows} more rows
            </p>
          )}

          <div className="preview-actions">
            <button
              className="btn btn-ghost"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirmSend}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Confirm & Send"}
            </button>
          </div>
        </div>

        {error && (
          <div className="upload-error">
            <p>{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="csv-upload-container">
      <div
        className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="upload-loading">
            <div className="spinner"></div>
            <p>Processing {fileName}...</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3>Upload Your Bookkeeping Records</h3>
            <p className="upload-instructions">
              Drag and drop your CSV or Excel file here, or click to browse
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              id="file-upload"
              className="file-input"
            />
            <label htmlFor="file-upload" className="btn btn-primary upload-btn">
              Choose File
            </label>
            <p className="upload-formats">Supports: CSV, XLSX, XLS</p>
          </>
        )}
      </div>
      {error && (
        <div className="upload-error">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default CSVUpload;
