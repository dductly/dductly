import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface DonationRecord {
  date?: string;
  recipient?: string;
  amount?: string | number;
  category?: string;
  description?: string;
  [key: string]: string | number | undefined;
}

interface CSVUploadProps {
  onDataParsed: (data: DonationRecord[]) => void;
}

const CSVUpload: React.FC<CSVUploadProps> = ({ onDataParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFile = (file: File) => {
    setIsLoading(true);
    setError("");
    setFileName(file.name);

    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (fileExtension === "csv") {
      // Parse CSV file
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setIsLoading(false);
          onDataParsed(results.data as DonationRecord[]);
        },
        error: (err) => {
          setIsLoading(false);
          setError(`Error parsing CSV: ${err.message}`);
        },
      });
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      // Parse Excel file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as DonationRecord[];

          setIsLoading(false);
          onDataParsed(jsonData);
        } catch (err) {
          setIsLoading(false);
          setError(`Error parsing Excel file: ${(err as Error).message}`);
        }
      };
      reader.onerror = () => {
        setIsLoading(false);
        setError("Error reading file");
      };
      reader.readAsArrayBuffer(file);
    } else {
      setIsLoading(false);
      setError("Please upload a CSV or Excel (.xlsx, .xls) file");
    }
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
            {fileName && !error && (
              <p className="upload-success">Loaded: {fileName}</p>
            )}
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
