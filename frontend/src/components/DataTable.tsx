import React, { useState } from "react";

interface DonationRecord {
  date?: string;
  recipient?: string;
  amount?: string | number;
  category?: string;
  description?: string;
  [key: string]: string | number | undefined;
}

interface DataTableProps {
  data: DonationRecord[];
  onSave?: (data: DonationRecord[]) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, onSave }) => {
  const [editedData, setEditedData] = useState<DonationRecord[]>(data);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  if (data.length === 0) {
    return null;
  }

  // Get all unique column headers from the data
  const columns = Array.from(
    new Set(data.flatMap((row) => Object.keys(row)))
  );

  // Format column headers nicely (capitalize first letter)
  const formatHeader = (header: string): string => {
    return header
      .split(/(?=[A-Z])|_|-/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Format cell values
  const formatValue = (value: string | number | undefined): string => {
    if (value === undefined || value === null) return "";
    if (typeof value === "number") {
      // Check if it looks like a dollar amount
      return `$${value.toFixed(2)}`;
    }
    return String(value);
  };

  // Handle sorting
  const handleSort = (column: string) => {
    const newDirection =
      sortColumn === column && sortDirection === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortDirection(newDirection);

    const sorted = [...editedData].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      if (aVal === undefined) return 1;
      if (bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return newDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return newDirection === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    setEditedData(sorted);
  };

  // Calculate total if there's an amount column
  const calculateTotal = (): number => {
    const amountColumn = columns.find((col) =>
      col.toLowerCase().includes("amount")
    );
    if (!amountColumn) return 0;

    return editedData.reduce((sum, row) => {
      const value = row[amountColumn];
      const num = typeof value === "number" ? value : parseFloat(String(value) || "0");
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  };

  const total = calculateTotal();

  const handleSaveToDatabase = () => {
    if (onSave) {
      onSave(editedData);
    }
  };

  const handleExport = () => {
    // Convert to CSV for download
    const headers = columns.join(",");
    const rows = editedData
      .map((row) => columns.map((col) => `"${row[col] || ""}"`).join(","))
      .join("\n");
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookkeeping-data-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="data-table-container">
      <div className="table-header">
        <div className="table-info">
          <h3>Imported Records</h3>
          <p className="record-count">{editedData.length} records loaded</p>
          {total > 0 && (
            <p className="total-amount">Total Amount: ${total.toFixed(2)}</p>
          )}
        </div>
        <div className="table-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            Export CSV
          </button>
          {onSave && (
            <button className="btn btn-primary" onClick={handleSaveToDatabase}>
              Save to Account
            </button>
          )}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} onClick={() => handleSort(column)}>
                  <div className="header-cell">
                    <span>{formatHeader(column)}</span>
                    {sortColumn === column && (
                      <span className="sort-indicator">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {editedData.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column}>{formatValue(row[column])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
