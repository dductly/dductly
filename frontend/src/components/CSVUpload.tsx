import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";

interface CSVUploadProps {
  userName: string | null;
  onEmailSuccess: (fileName: string) => void;
}

interface ParsedData {
  headers: string[];
  rows: unknown[][];
  file: File;
}

type RowType = "expense" | "income";
type Step = "upload" | "map" | "preview" | "importing" | "summary";

interface ClassifiedRow {
  rowNum: number;
  type: RowType;
  errors: string[];
  expenseData: Record<string, unknown> | null;
  incomeData: Record<string, unknown> | null;
}

// ─── Field definitions ────────────────────────────────────────────────────────
const FIELDS = [
  { key: "date",             label: "Date",                    required: true,  hint: "The date of the transaction" },
  { key: "amount",           label: "Amount ($)",              required: true,  hint: "Dollar amount — negative values go to Expenses, positive to Income" },
  { key: "transaction_type", label: "Transaction Type",        required: false, hint: "Optional: a column with values like expense/income or debit/credit" },
  { key: "category",         label: "Category",                required: false, hint: "e.g. Supplies, Sales, Travel" },
  { key: "contact",          label: "Vendor / Customer",       required: false, hint: "Who you paid or who paid you" },
  { key: "description",      label: "Description / Title",     required: false, hint: "Short note about the transaction" },
  { key: "payment_method",   label: "Payment Method",          required: false, hint: "e.g. Cash, Credit Card, Venmo" },
  { key: "tip",              label: "Tip ($)",                 required: false, hint: "For income rows only" },
];

// ─── Auto-detection patterns ──────────────────────────────────────────────────
const AUTO_DETECT: Record<string, string[]> = {
  date:             ["date", "transaction date", "posted date", "purchase date", "expense date", "income date", "day"],
  amount:           ["amount", "total", "cost", "price", "value", "sum", "charge", "debit", "credit", "revenue", "income"],
  transaction_type: ["type", "transaction type", "category type", "kind", "debit/credit", "in/out", "d/c"],
  category:         ["category", "expense type", "income type", "expense category", "income category"],
  contact:          ["vendor", "merchant", "payee", "supplier", "customer", "client", "buyer", "payer", "company", "store", "name", "from", "to"],
  description:      ["description", "notes", "note", "memo", "title", "details", "remarks", "item", "product", "label"],
  payment_method:   ["payment method", "payment", "paid by", "method", "pay method"],
  tip:              ["tip", "gratuity", "tips"],
};

// ─── Category / payment normalisation ────────────────────────────────────────
const EXPENSE_CATEGORIES = ["booth-fees","supplies","materials","equipment","travel","marketing","packaging","utilities","insurance","other"];

const cellToString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().split("T")[0];
  return String(value).trim();
};

const parseAmount = (value: unknown): number | null => {
  const str = cellToString(value).replace(/[$,\s]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
};

const parseDate = (value: unknown): string | null => {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,"0")}-${String(value.getDate()).padStart(2,"0")}`;
  }
  const str = cellToString(value);
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
};

const normaliseExpenseCategory = (raw: string): string => {
  const v = raw.toLowerCase().trim();
  if (EXPENSE_CATEGORIES.includes(v)) return v;
  if (v.includes("booth") || v.includes("vendor fee") || v.includes("stall") || v.includes("table fee")) return "booth-fees";
  if (v.includes("supply") || v.includes("supplies") || v.includes("office") || v.includes("craft")) return "supplies";
  if (v.includes("material") || v.includes("raw")) return "materials";
  if (v.includes("equip") || v.includes("tool") || v.includes("hardware")) return "equipment";
  if (v.includes("travel") || v.includes("mileage") || v.includes("fuel") || v.includes("gas") || v.includes("parking") || v.includes("transport")) return "travel";
  if (v.includes("market") || v.includes("advertis") || v.includes("promot") || v.includes("social")) return "marketing";
  if (v.includes("packag") || v.includes("box") || v.includes("bag") || v.includes("wrap") || v.includes("label")) return "packaging";
  if (v.includes("util") || v.includes("electric") || v.includes("internet") || v.includes("phone") || v.includes("wifi")) return "utilities";
  if (v.includes("insur")) return "insurance";
  return "other";
};

const normalisePaymentMethod = (raw: string): string => {
  const v = raw.toLowerCase().trim();
  if (["cash","credit-card","debit-card","venmo","check","bank-transfer","other"].includes(v)) return v;
  if (v.includes("credit") || v.includes("visa") || v.includes("mastercard") || v.includes("amex") || v.includes("cc")) return "credit-card";
  if (v.includes("debit")) return "debit-card";
  if (v.includes("check") || v.includes("cheque")) return "check";
  if (v.includes("bank") || v.includes("wire") || v.includes("ach") || v.includes("zelle") || v.includes("transfer")) return "bank-transfer";
  if (v.includes("venmo") || v.includes("paypal") || v.includes("cashapp") || v.includes("square")) return "venmo";
  if (v.includes("cash")) return "cash";
  return "other";
};

// ─── Classify a row as expense or income ─────────────────────────────────────
const classifyRow = (typeValue: string, amount: number): RowType => {
  if (typeValue) {
    const v = typeValue.toLowerCase().trim();
    const expenseWords = ["expense", "expenses", "debit", "out", "e", "purchase", "cost", "dr", "-", "withdrawal"];
    const incomeWords  = ["income", "revenue", "credit", "in", "i", "sale", "deposit", "cr", "+", "receipt"];
    if (expenseWords.some(w => v === w || v.includes(w))) return "expense";
    if (incomeWords.some(w => v === w || v.includes(w)))  return "income";
  }
  // Fallback: negative = expense, positive = income
  return amount < 0 ? "expense" : "income";
};

// ─── Auto-detect column mapping ───────────────────────────────────────────────
const autoDetect = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {};
  for (const [field, patterns] of Object.entries(AUTO_DETECT)) {
    for (const header of headers) {
      const h = header.toLowerCase().trim();
      if (patterns.some(p => h === p || h.includes(p))) {
        if (!mapping[field]) { mapping[field] = header; break; }
      }
    }
  }
  return mapping;
};

// ─── Transform + validate one row ────────────────────────────────────────────
const processRow = (
  row: unknown[],
  headers: string[],
  mapping: Record<string, string>,
  rowNum: number
): ClassifiedRow => {
  const errors: string[] = [];

  const get = (field: string): unknown => {
    const col = mapping[field];
    if (!col) return undefined;
    const idx = headers.indexOf(col);
    return idx >= 0 ? row[idx] : undefined;
  };

  // Date
  const date = parseDate(get("date"));
  if (!date) errors.push("Date is missing or invalid");

  // Amount
  const rawAmount = parseAmount(get("amount"));
  if (rawAmount === null) errors.push("Amount is missing or invalid");

  if (errors.length > 0) {
    return { rowNum, type: "income", errors, expenseData: null, incomeData: null };
  }

  const amount = rawAmount!;
  const typeRaw = cellToString(get("transaction_type"));
  const rowType = classifyRow(typeRaw, amount);
  const absAmount = Math.abs(amount);

  const category  = cellToString(get("category"));
  const contact   = cellToString(get("contact"));
  const desc      = cellToString(get("description")).slice(0, 50);
  const pmRaw     = cellToString(get("payment_method"));
  const pm        = pmRaw ? normalisePaymentMethod(pmRaw) : "other";

  if (rowType === "expense") {
    return {
      rowNum, type: "expense", errors: [],
      expenseData: {
        expense_date:   date!,
        amount:         absAmount,
        category:       category ? normaliseExpenseCategory(category) : "other",
        vendor:         contact,
        description:    desc,
        payment_method: pm,
        attachments:    [],
      },
      incomeData: null,
    };
  } else {
    const tipVal = parseAmount(get("tip"));
    return {
      rowNum, type: "income", errors: [],
      expenseData: null,
      incomeData: {
        income_date:    date!,
        amount:         absAmount,
        category:       category || "other",
        customer:       contact,
        description:    desc,
        payment_method: pm,
        tip:            tipVal ?? 0,
        market:         "",
        attachments:    [],
      },
    };
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
const CSVUpload: React.FC<CSVUploadProps> = () => {
  const { addExpense } = useExpenses();
  const { addIncome }  = useIncome();

  const [step, setStep]               = useState<Step>("upload");
  const [isDragging, setIsDragging]   = useState(false);
  const [fileName, setFileName]       = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState("");
  const [parsedData, setParsedData]   = useState<ParsedData | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [processedRows, setProcessedRows] = useState<ClassifiedRow[]>([]);
  const [progress, setProgress]       = useState(0);
  const [showAllPreview, setShowAllPreview] = useState(false);
  const [showAllSkipped, setShowAllSkipped] = useState(false);
  const [editingRowNum, setEditingRowNum] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    rowType: RowType; date: string; amount: string; category: string;
    contact: string; description: string; payment_method: string; tip: string;
  }>({ rowType: "expense", date: "", amount: "", category: "", contact: "", description: "", payment_method: "", tip: "" });
  const [results, setResults]         = useState<{
    expenses: number; income: number; skipped: number; failed: number;
  } | null>(null);

  // ── Parse CSV ──────────────────────────────────────────────────────────────
  const parseCSV = (file: File): Promise<ParsedData> =>
    new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (r) => {
          const data = r.data as string[][];
          if (!data.length) { reject(new Error("File is empty")); return; }
          resolve({
            headers: (data[0] || []).map(String),
            rows: data.slice(1).filter(r => r.some(c => String(c).trim() !== "")),
            file,
          });
        },
        error: (err) => reject(err),
      });
    });

  // ── Parse Excel ────────────────────────────────────────────────────────────
  const parseExcel = (file: File): Promise<ParsedData> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result, { type: "binary", cellDates: true });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" }) as unknown[][];
          if (!data.length) { reject(new Error("File is empty")); return; }
          resolve({
            headers: (data[0] as unknown[]).map(String),
            rows: data.slice(1).filter(r => r.some(c => String(c).trim() !== "")),
            file,
          });
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsBinaryString(file);
    });

  // ── Handle file ────────────────────────────────────────────────────────────
  const handleFile = async (file: File) => {
    setIsLoading(true);
    setError("");
    setFileName(file.name);
    setParsedData(null);
    try {
      let parsed: ParsedData;
      if (file.name.endsWith(".csv")) parsed = await parseCSV(file);
      else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) parsed = await parseExcel(file);
      else throw new Error("Unsupported format. Please use CSV or Excel files.");
      if (!parsed.rows.length) throw new Error("No data rows found in file.");
      setParsedData(parsed);
      setColumnMapping(autoDetect(parsed.headers));
      setStep("map");
    } catch (err) {
      setError((err instanceof Error && err.message) || "Failed to parse file.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Map → Preview ──────────────────────────────────────────────────────────
  const handleProceedToPreview = () => {
    if (!columnMapping["date"]) { setError("Please map the Date column — it's required."); return; }
    if (!columnMapping["amount"]) { setError("Please map the Amount column — it's required."); return; }
    setError("");
    const rows = parsedData!.rows.map((row, i) =>
      processRow(row, parsedData!.headers, columnMapping, i + 2)
    );
    setProcessedRows(rows);
    setStep("preview");
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImport = async (valid: ClassifiedRow[]) => {
    setStep("importing");
    setProgress(0);
    const res = { expenses: 0, income: 0, skipped: processedRows.length - valid.length, failed: 0 };

    for (let i = 0; i < valid.length; i++) {
      try {
        if (valid[i].type === "expense") {
          await addExpense(valid[i].expenseData as Parameters<typeof addExpense>[0]);
          res.expenses++;
        } else {
          await addIncome(valid[i].incomeData as Parameters<typeof addIncome>[0]);
          res.income++;
        }
      } catch {
        res.failed++;
      }
      setProgress(Math.round(((i + 1) / valid.length) * 100));
    }

    setResults(res);
    if (res.expenses > 0 || res.income > 0) {
      localStorage.setItem("dductly_recently_imported", "true");
    }
    setStep("summary");
  };

  const reset = () => {
    setStep("upload"); setParsedData(null); setColumnMapping({});
    setProcessedRows([]); setProgress(0); setResults(null);
    setError(""); setFileName(""); setShowAllPreview(false); setShowAllSkipped(false);
    setEditingRowNum(null);
  };

  // ── Open inline edit form for a skipped row ────────────────────────────────
  const openEdit = (r: ClassifiedRow) => {
    // Pre-fill from whatever was parsed out of the raw row via column mapping
    const raw = parsedData!.rows[r.rowNum - 2] ?? [];
    const get = (field: string) => {
      const col = columnMapping[field];
      if (!col) return "";
      const idx = parsedData!.headers.indexOf(col);
      return idx >= 0 ? cellToString(raw[idx]) : "";
    };
    const rawAmount = get("amount");
    const numAmount = parseFloat(rawAmount.replace(/[$,]/g, ""));
    setEditForm({
      rowType: !isNaN(numAmount) && numAmount < 0 ? "expense" : "income",
      date: get("date"),
      amount: rawAmount.replace(/[$,]/g, "").replace(/-/, ""),
      category: get("category"),
      contact: get("contact"),
      description: get("description"),
      payment_method: get("payment_method"),
      tip: get("tip"),
    });
    setEditingRowNum(r.rowNum);
  };

  // ── Save edited row back into processedRows ────────────────────────────────
  const saveEdit = () => {
    const date = parseDate(editForm.date);
    const amount = parseAmount(editForm.amount);
    const editErrors: string[] = [];
    if (!date) editErrors.push("Date is missing or invalid");
    if (amount === null) editErrors.push("Amount is missing or invalid");
    if (editErrors.length > 0) { setError(editErrors.join(" · ")); return; }
    setError("");

    const pm = editForm.payment_method ? normalisePaymentMethod(editForm.payment_method) : "other";
    const desc = editForm.description.slice(0, 50);

    let fixed: ClassifiedRow;
    if (editForm.rowType === "expense") {
      fixed = {
        rowNum: editingRowNum!, type: "expense", errors: [],
        expenseData: {
          expense_date: date!, amount: Math.abs(amount!),
          category: editForm.category ? normaliseExpenseCategory(editForm.category) : "other",
          vendor: editForm.contact, description: desc, payment_method: pm, attachments: [],
        },
        incomeData: null,
      };
    } else {
      fixed = {
        rowNum: editingRowNum!, type: "income", errors: [],
        expenseData: null,
        incomeData: {
          income_date: date!, amount: Math.abs(amount!),
          category: editForm.category || "other",
          customer: editForm.contact, description: desc, payment_method: pm,
          tip: parseAmount(editForm.tip) ?? 0, market: "", attachments: [],
        },
      };
    }

    setProcessedRows(prev => prev.map(r => r.rowNum === editingRowNum ? fixed : r));
    setEditingRowNum(null);
  };

  // ── Download skipped rows as CSV ───────────────────────────────────────────
  const downloadSkipped = (invalid: ClassifiedRow[]) => {
    const headers = [...(parsedData?.headers ?? []), "Error"];
    const rows = invalid.map(r => {
      const raw = parsedData!.rows[r.rowNum - 2] ?? [];
      return [...raw.map(cellToString), r.errors.join("; ")];
    });
    const csv = [headers, ...rows]
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "dductly-skipped-rows.csv"; link.click();
    URL.revokeObjectURL(url);
  };

  const card = (children: React.ReactNode) => (
    <div className="csv-upload-container">
      <div className="preview-container">{children}</div>
      {error && <div className="upload-error"><p>{error}</p></div>}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP: UPLOAD
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "upload") return (
    <div className="csv-upload-container">
      <div
        className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
      >
        {isLoading ? (
          <div className="upload-loading">
            <div className="spinner"></div>
            <p>Reading {fileName}…</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3>Upload Your Records</h3>
            <p className="upload-instructions">
              Upload one file with all your transactions — we'll automatically sort expenses and income for you.
            </p>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} id="file-upload" className="file-input" />
            <label htmlFor="file-upload" className="btn btn-primary upload-btn">Choose File</label>
            <p className="upload-formats">Supports: CSV, XLSX, XLS</p>
          </>
        )}
      </div>
      {error && <div className="upload-error"><p>{error}</p></div>}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP: MAP COLUMNS
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "map") {
    const headers = parsedData!.headers;
    const sampleValues = (header: string) =>
      parsedData!.rows.slice(0, 5)
        .map(r => cellToString(r[headers.indexOf(header)]))
        .filter(Boolean).slice(0, 3).join(", ");

    return card(
      <>
        <div className="preview-header">
          <h3>Match Your Columns</h3>
          <p className="preview-subtitle">
            <strong>{fileName}</strong> · {parsedData!.rows.length} rows · We've auto-matched what we can — adjust anything that looks off.
          </p>
        </div>

        {/* How classification works */}
        <div style={{ background: "var(--bg-secondary)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", fontSize: "0.83rem", color: "var(--text-medium)", lineHeight: 1.6 }}>
          <strong>How we sort your data:</strong> If you have a "Transaction Type" column, we'll use it (values like "expense"/"income" or "debit"/"credit"). Otherwise, <strong>negative amounts → Expenses</strong>, <strong>positive amounts → Income</strong>.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
          {FIELDS.map((field) => {
            const mapped = columnMapping[field.key] || "";
            const sample = mapped ? sampleValues(mapped) : "";
            return (
              <div key={field.key} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", alignItems: "center",
                padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: "10px",
                border: field.required && !mapped ? "1px solid var(--error-red)" : "1px solid transparent",
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-dark)" }}>
                    {field.label}
                    {field.required && <span style={{ color: "var(--error-red)", marginLeft: "4px" }}>*</span>}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "2px" }}>
                    {sample ? `e.g. ${sample}` : field.hint}
                  </div>
                </div>
                <select
                  value={mapped}
                  onChange={(e) => { setColumnMapping(prev => ({ ...prev, [field.key]: e.target.value })); setError(""); }}
                  className="expense-select"
                  style={{ width: "100%" }}
                >
                  <option value="">— not in file / skip —</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            );
          })}
        </div>

        <div className="preview-actions">
          <button className="btn btn-ghost" onClick={reset}>← Start Over</button>
          <button className="btn btn-primary" onClick={handleProceedToPreview}>Preview Import →</button>
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP: PREVIEW + VALIDATE
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "preview") {
    const valid   = processedRows.filter(r => r.errors.length === 0);
    const invalid = processedRows.filter(r => r.errors.length > 0);
    const expenses = valid.filter(r => r.type === "expense");
    const incomeRows = valid.filter(r => r.type === "income");
    const preview = showAllPreview ? valid : valid.slice(0, 6);

    return card(
      <>
        <div className="preview-header">
          <h3>Ready to Import</h3>
          <p className="preview-subtitle">Here's what we found — review before saving to your account.</p>
        </div>

        {/* Classification summary */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", margin: "16px 0" }}>
          <span style={{ padding: "6px 14px", background: "#fee2e2", color: "#991b1b", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600 }}>
            💸 {expenses.length} Expenses
          </span>
          <span style={{ padding: "6px 14px", background: "#d1fae5", color: "#065f46", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600 }}>
            💰 {incomeRows.length} Income
          </span>
          {invalid.length > 0 && (
            <span style={{ padding: "6px 14px", background: "#fef3c7", color: "#92400e", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600 }}>
              ⚠️ {invalid.length} rows have errors (will be skipped)
            </span>
          )}
        </div>

        {/* Preview table */}
        {preview.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "0.83rem", color: "var(--text-light)", marginBottom: "8px" }}>
              Preview of first {preview.length} valid rows:
            </p>
            <div className="preview-table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Vendor / Customer</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r) => {
                    const d = r.type === "expense" ? r.expenseData! : r.incomeData!;
                    const date = r.type === "expense" ? d.expense_date : d.income_date;
                    const contact = r.type === "expense" ? d.vendor : d.customer;
                    return (
                      <tr key={r.rowNum}>
                        <td>
                          <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: 600,
                            background: r.type === "expense" ? "#fee2e2" : "#d1fae5",
                            color: r.type === "expense" ? "#991b1b" : "#065f46" }}>
                            {r.type === "expense" ? "Expense" : "Income"}
                          </span>
                        </td>
                        <td>{String(date)}</td>
                        <td>${Number(d.amount).toFixed(2)}</td>
                        <td>{String(d.category)}</td>
                        <td>{String(contact)}</td>
                        <td>{String(d.description)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {valid.length > 6 && (
              <p
                className="preview-more-rows"
                onClick={() => setShowAllPreview(v => !v)}
                style={{ cursor: "pointer", color: "var(--primary-blue)", textDecoration: "underline", userSelect: "none" }}
              >
                {showAllPreview ? "Show less ↑" : `…and ${valid.length - 6} more rows — click to see all`}
              </p>
            )}
          </div>
        )}

        {/* Skipped rows with inline editing */}
        {invalid.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <p
                style={{ fontSize: "0.85rem", fontWeight: 600, color: "#92400e", cursor: "pointer", userSelect: "none" }}
                onClick={() => setShowAllSkipped(v => !v)}
              >
                ⚠️ {invalid.length} row{invalid.length !== 1 ? "s" : ""} being skipped {showAllSkipped ? "▲" : "▼"}
              </p>
              <button
                className="btn btn-ghost"
                style={{ fontSize: "0.78rem", padding: "4px 10px" }}
                onClick={() => downloadSkipped(invalid)}
              >
                Download skipped as CSV
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(showAllSkipped ? invalid : invalid.slice(0, 2)).map(r => (
                <div key={r.rowNum}>
                  {editingRowNum === r.rowNum ? (
                    <div style={{ background: "#fffbeb", border: "1px solid #f59e0b", borderRadius: "10px", padding: "16px" }}>
                      {error && <div style={{ color: "var(--error-red)", fontSize: "0.82rem", marginBottom: "10px" }}>{error}</div>}
                      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                        <button
                          type="button"
                          onClick={() => setEditForm(f => ({ ...f, rowType: "expense" }))}
                          style={{ flex: 1, padding: "6px", borderRadius: "8px", border: "2px solid", cursor: "pointer",
                            borderColor: editForm.rowType === "expense" ? "#ef4444" : "#e5e7eb",
                            background: editForm.rowType === "expense" ? "#fee2e2" : "transparent",
                            color: editForm.rowType === "expense" ? "#991b1b" : "var(--text-medium)", fontWeight: 600, fontSize: "0.85rem" }}
                        >
                          Expense
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditForm(f => ({ ...f, rowType: "income" }))}
                          style={{ flex: 1, padding: "6px", borderRadius: "8px", border: "2px solid", cursor: "pointer",
                            borderColor: editForm.rowType === "income" ? "#10b981" : "#e5e7eb",
                            background: editForm.rowType === "income" ? "#d1fae5" : "transparent",
                            color: editForm.rowType === "income" ? "#065f46" : "var(--text-medium)", fontWeight: 600, fontSize: "0.85rem" }}
                        >
                          Income
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dark)", display: "block", marginBottom: "4px" }}>Date *</label>
                          <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                            className="expense-input" style={{ width: "100%" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dark)", display: "block", marginBottom: "4px" }}>Amount ($) *</label>
                          <input type="number" step="0.01" min="0" placeholder="0.00" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                            className="expense-input" style={{ width: "100%" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dark)", display: "block", marginBottom: "4px" }}>Category</label>
                          <input type="text" placeholder="e.g. supplies" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                            className="expense-input" style={{ width: "100%" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dark)", display: "block", marginBottom: "4px" }}>Vendor / Customer</label>
                          <input type="text" placeholder="Who paid / was paid" value={editForm.contact} onChange={e => setEditForm(f => ({ ...f, contact: e.target.value }))}
                            className="expense-input" style={{ width: "100%" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dark)", display: "block", marginBottom: "4px" }}>Description</label>
                          <input type="text" placeholder="Short note" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                            className="expense-input" style={{ width: "100%" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dark)", display: "block", marginBottom: "4px" }}>Payment Method</label>
                          <input type="text" placeholder="e.g. cash, credit card" value={editForm.payment_method} onChange={e => setEditForm(f => ({ ...f, payment_method: e.target.value }))}
                            className="expense-input" style={{ width: "100%" }} />
                        </div>
                        {editForm.rowType === "income" && (
                          <div>
                            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dark)", display: "block", marginBottom: "4px" }}>Tip ($)</label>
                            <input type="number" step="0.01" min="0" placeholder="0.00" value={editForm.tip} onChange={e => setEditForm(f => ({ ...f, tip: e.target.value }))}
                              className="expense-input" style={{ width: "100%" }} />
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button className="btn btn-ghost" style={{ fontSize: "0.82rem", padding: "6px 14px" }}
                          onClick={() => { setEditingRowNum(null); setError(""); }}>
                          Cancel
                        </button>
                        <button className="btn btn-primary" style={{ fontSize: "0.82rem", padding: "6px 14px" }} onClick={saveEdit}>
                          Save Row
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                      fontSize: "0.82rem", padding: "8px 12px", background: "#fef3c7", borderRadius: "8px", color: "#78350f" }}>
                      <span>Row {r.rowNum}: {r.errors.join("; ")}</span>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: "0.78rem", padding: "4px 10px", marginLeft: "12px", flexShrink: 0 }}
                        onClick={() => openEdit(r)}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {invalid.length > 2 && (
                <p
                  onClick={() => setShowAllSkipped(v => !v)}
                  style={{ cursor: "pointer", fontSize: "0.8rem", color: "var(--primary-blue)", textDecoration: "underline", userSelect: "none", marginTop: "2px" }}
                >
                  {showAllSkipped ? "Show less ↑" : `…and ${invalid.length - 2} more skipped rows — click to expand`}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="preview-actions">
          <button className="btn btn-ghost" onClick={() => setStep("map")}>← Back</button>
          {valid.length > 0 ? (
            <button className="btn btn-primary" onClick={() => handleImport(valid)}>
              Import {valid.length} Record{valid.length !== 1 ? "s" : ""}
            </button>
          ) : (
            <span style={{ fontSize: "0.9rem", color: "var(--error-red)" }}>No valid rows — go back and fix the column mapping.</span>
          )}
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP: IMPORTING
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "importing") {
    const total = processedRows.filter(r => r.errors.length === 0).length;
    return (
      <div className="csv-upload-container">
        <div className="preview-container" style={{ textAlign: "center", padding: "40px 24px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>⏳</div>
          <h3 style={{ marginBottom: "8px" }}>Importing your records…</h3>
          <p style={{ color: "var(--text-medium)", fontSize: "0.9rem", marginBottom: "24px" }}>
            {Math.round((progress / 100) * total)} of {total} records saved
          </p>
          <div style={{ height: "10px", background: "var(--bg-secondary)", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "var(--primary-blue)", borderRadius: "10px", transition: "width 0.2s ease" }} />
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: "10px" }}>{progress}%</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP: SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "summary" && results) return (
    <div className="csv-upload-container">
      <div className="preview-container">
        <div className="preview-header"><h3>Import Complete 🎉</h3></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "20px 0" }}>
          {results.expenses > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: "#fee2e2", borderRadius: "10px" }}>
              <span style={{ fontSize: "1.5rem" }}>💸</span>
              <div>
                <div style={{ fontWeight: 700, color: "#991b1b" }}>{results.expenses} expense{results.expenses !== 1 ? "s" : ""} added</div>
                <div style={{ fontSize: "0.82rem", color: "#b91c1c" }}>Now visible on your Expenses page</div>
              </div>
            </div>
          )}
          {results.income > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: "#d1fae5", borderRadius: "10px" }}>
              <span style={{ fontSize: "1.5rem" }}>💰</span>
              <div>
                <div style={{ fontWeight: 700, color: "#065f46" }}>{results.income} income record{results.income !== 1 ? "s" : ""} added</div>
                <div style={{ fontSize: "0.82rem", color: "#047857" }}>Now visible on your Income page</div>
              </div>
            </div>
          )}
          {results.skipped > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: "#fef3c7", borderRadius: "10px" }}>
              <span style={{ fontSize: "1.5rem" }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: "#92400e" }}>{results.skipped} rows skipped</div>
                <div style={{ fontSize: "0.82rem", color: "#b45309" }}>These had missing or invalid data</div>
              </div>
            </div>
          )}
          {results.failed > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: "#fee2e2", borderRadius: "10px" }}>
              <span style={{ fontSize: "1.5rem" }}>❌</span>
              <div>
                <div style={{ fontWeight: 700, color: "#991b1b" }}>{results.failed} records failed to save</div>
                <div style={{ fontSize: "0.82rem", color: "#b91c1c" }}>Check your connection and try again</div>
              </div>
            </div>
          )}
        </div>
        <div className="preview-actions">
          <button className="btn btn-ghost" onClick={reset}>Import Another File</button>
        </div>
      </div>
    </div>
  );

  return null;
};

export default CSVUpload;
