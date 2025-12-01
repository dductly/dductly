import React, { useState } from "react";

interface CSVUploadProps {
  userName: string | null;
  onEmailSuccess: (fileName: string) => void;
}

const CSVUpload: React.FC<CSVUploadProps> = ({ userName, onEmailSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

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
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        setIsLoading(false);
        reject(new Error("Failed to read file"));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setError("");
    setFileName(file.name);

    // Send file to Edge Function (fire-and-warn if it fails, but attempt parsing still)
    try {
      await sendFileToEmail(file);
      // optional: you could set a success state here
    } catch (err) {
      console.error("Error sending file to email function:", err);
      // show a non-blocking error to the user
      setError(
        (err instanceof Error && err.message) ||
          "Failed to send file to email function."
      );
      // allow parsing to continue even if email send failed
    }
  }
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
            {fileName && !error && <p className="upload-success">Ready for processing: {fileName}</p>}
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
