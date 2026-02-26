import React, { useState, useMemo } from "react";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";
import { useAuth } from "../hooks/useAuth";

interface TaxInsightsProps {
  onNavigate: (page: string) => void;
}

// ─── Schedule C mapping for expense categories ───────────────────────────────
const SCHEDULE_C_MAP: Record<string, { line: string; tip: string }> = {
  "booth-fees": {
    line: "Other Expenses — Line 27",
    tip: "Market and booth rental fees are deductible as ordinary business operating expenses.",
  },
  supplies: {
    line: "Supplies — Line 22",
    tip: "Business supplies consumed in your trade are fully deductible in the year purchased.",
  },
  materials: {
    line: "Cost of Goods Sold — Line 4",
    tip: "Raw materials used to make products you sell reduce your gross profit, lowering your taxable income.",
  },
  equipment: {
    line: "Depreciation / Section 179 — Line 13",
    tip: "Equipment may qualify for full expensing in the year of purchase under Section 179 — no need to spread it over multiple years.",
  },
  travel: {
    line: "Travel — Line 24a",
    tip: "Driving to markets, supplier pickups, or client meetings is deductible. Keep a mileage log — the 2025 IRS rate is 70¢ per mile.",
  },
  marketing: {
    line: "Advertising — Line 8",
    tip: "All advertising and promotion costs — including social media ads, business cards, and signage — are fully deductible.",
  },
  packaging: {
    line: "Supplies — Line 22",
    tip: "Packaging materials used for products you sell count as deductible supplies.",
  },
  utilities: {
    line: "Utilities — Line 25",
    tip: "Business utilities are deductible. If you use your phone or internet for business, you can deduct the business-use percentage.",
  },
  insurance: {
    line: "Insurance — Line 15",
    tip: "Business insurance premiums — liability, property, product — are fully deductible.",
  },
  other: {
    line: "Other Expenses — Line 27",
    tip: 'Keep clear notes on what "other" expenses were for. Well-documented expenses are much easier to defend if audited.',
  },
};

// ─── General write-off guide (not tied to logged data) ────────────────────────
const WRITEOFF_GUIDE = [
  {
    icon: "🚗",
    title: "Vehicle & Mileage",
    description:
      "Every mile you drive for business counts. Use the standard mileage rate (70¢/mile in 2025) or track actual vehicle expenses. This includes driving to markets, picking up supplies, and client visits.",
    note: "Keep a mileage log with date, destination, and business purpose for each trip. Note: commuting from home to a regular place of business is not deductible.",
  },
  {
    icon: "🏠",
    title: "Home Office",
    description:
      "If you use a dedicated space in your home exclusively and regularly for business, you can deduct a portion of rent/mortgage, utilities, and internet. The IRS simplified method allows $5 per square foot, up to 300 sq ft.",
    note: "The space must be used only for business — a shared guest room doesn't qualify.",
  },
  {
    icon: "📱",
    title: "Phone & Internet",
    description:
      "If you use your personal phone or internet for business, you can deduct the business-use percentage. If business is 60% of your usage, you deduct 60% of the bill.",
    note: "A dedicated business phone line is 100% deductible.",
  },
  {
    icon: "🎓",
    title: "Education & Training",
    description:
      "Courses, books, workshops, and subscriptions that improve your skills in your current business are deductible. This includes online courses, craft workshops, and business coaching.",
    note: "Education for a new career or business field generally doesn't qualify.",
  },
  {
    icon: "💻",
    title: "Software & Subscriptions",
    description:
      "Business software, apps, cloud storage, and platform fees (like dductly!) used for your business are fully deductible.",
    note: "Keep receipts and note the business purpose for each subscription.",
  },
  {
    icon: "🏥",
    title: "Self-Employed Health Insurance",
    description:
      "If you pay for your own health, dental, or vision insurance and aren't eligible for coverage through a spouse's employer, 100% of premiums are deductible — even if you don't itemize.",
    note: "This deduction goes on Schedule 1, not Schedule C.",
  },
  {
    icon: "💰",
    title: "Retirement Contributions",
    description:
      "Contributing to a SEP-IRA, SIMPLE IRA, or Solo 401(k) as a self-employed person is deductible and lowers your taxable income significantly. SEP-IRA allows up to 25% of net self-employment income.",
    note: "Contributions for the prior tax year can often be made up to the filing deadline.",
  },
  {
    icon: "🤝",
    title: "Professional Services",
    description:
      "Fees paid to accountants, bookkeepers, lawyers, and consultants for your business are fully deductible. This includes tax prep fees specifically for your business return.",
    note: "Keep the invoice showing the service was for your business.",
  },
  {
    icon: "🍽️",
    title: "Business Meals",
    description:
      "Meals with clients, customers, or business partners where business is discussed are 50% deductible. Keep a note of who attended and what was discussed.",
    note: "Entertainment expenses (concerts, sporting events) are no longer deductible post-2018.",
  },
  {
    icon: "📦",
    title: "Shipping & Postage",
    description:
      "Any shipping, postage, or freight costs directly related to your business — sending orders, returning supplier items — are fully deductible.",
    note: "Track these separately from supplies for cleaner records.",
  },
];

// ─── Key deadlines ─────────────────────────────────────────────────────────────
// Adjusts a date forward if it falls on a weekend (IRS rule: next business day)
const nextBusinessDay = (date: Date): Date => {
  const day = date.getDay();
  if (day === 6) date.setDate(date.getDate() + 2); // Saturday → Monday
  if (day === 0) date.setDate(date.getDate() + 1); // Sunday → Monday
  return date;
};

const getDeadlines = (year: number) => [
  {
    label: "Q1 Estimated Taxes",
    date: nextBusinessDay(new Date(year, 3, 15)), // Apr 15
    description: `Covers income earned Jan 1 – Mar 31, ${year}`,
    type: "quarterly",
  },
  {
    label: "Q2 Estimated Taxes",
    date: nextBusinessDay(new Date(year, 5, 15)), // Jun 15
    description: `Covers income earned Apr 1 – May 31, ${year}`,
    type: "quarterly",
  },
  {
    label: "Q3 Estimated Taxes",
    date: nextBusinessDay(new Date(year, 8, 15)), // Sep 15
    description: `Covers income earned Jun 1 – Aug 31, ${year}`,
    type: "quarterly",
  },
  {
    label: `${year} Annual Return (Sole Prop)`,
    date: nextBusinessDay(new Date(year + 1, 3, 15)), // Apr 15 next year
    description: `Schedule C due with your Form 1040 for tax year ${year}`,
    type: "annual",
  },
  {
    label: "Q4 Estimated Taxes",
    date: nextBusinessDay(new Date(year + 1, 0, 15)), // Jan 15 next year
    description: `Covers income earned Sep 1 – Dec 31, ${year}`,
    type: "quarterly",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const formatCategoryLabel = (cat: string) =>
  cat.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

// ─── Component ────────────────────────────────────────────────────────────────
const TaxInsights: React.FC<TaxInsightsProps> = ({ onNavigate }) => {
  const { expenses } = useExpenses();
  const { incomes } = useIncome();
  const { user } = useAuth();

  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<"snapshot" | "guide" | "deadlines">("snapshot");

  // Parse year directly from "YYYY-MM-DD" string to avoid UTC/local timezone bugs
  const yearOf = (dateStr: string) => parseInt(dateStr.substring(0, 4), 10);

  const availableYears = useMemo(() => {
    const s = new Set<number>();
    // Always show last 5 years so users can see empty years
    for (let y = currentYear; y >= currentYear - 4; y--) s.add(y);
    expenses.forEach((e) => s.add(yearOf(e.expense_date)));
    incomes.forEach((i) => s.add(yearOf(i.income_date)));
    return Array.from(s).sort((a, b) => b - a);
  }, [expenses, incomes, currentYear]);

  // Default to the most recent year that has actual data, fallback to current year
  const defaultYear = useMemo(() => {
    const yearsWithData = new Set<number>();
    expenses.forEach((e) => yearsWithData.add(yearOf(e.expense_date)));
    incomes.forEach((i) => yearsWithData.add(yearOf(i.income_date)));
    if (yearsWithData.size === 0) return currentYear;
    return Math.max(...yearsWithData);
  }, [expenses, incomes, currentYear]);

  const [selectedYear, setSelectedYear] = useState(() => defaultYear);

  const yearExpenses = useMemo(
    () => expenses.filter((e) => yearOf(e.expense_date) === selectedYear),
    [expenses, selectedYear]
  );
  const yearIncomes = useMemo(
    () => incomes.filter((i) => yearOf(i.income_date) === selectedYear),
    [incomes, selectedYear]
  );

  const totalIncome = yearIncomes.reduce((sum, i) => sum + i.amount + (i.tip || 0), 0);
  const totalDeductible = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalIncome - totalDeductible;

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    yearExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [yearExpenses]);

  const loggedCategories = useMemo(
    () => new Set(yearExpenses.map((e) => e.category)),
    [yearExpenses]
  );

  const missingCategories = ["travel", "insurance", "equipment", "utilities"].filter(
    (c) => !loggedCategories.has(c)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlines = getDeadlines(selectedYear).sort((a, b) => a.date.getTime() - b.date.getTime());

  const getDeadlineStatus = (date: Date) => {
    const msLeft = date.getTime() - today.getTime();
    const days = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Passed", color: "var(--text-light)", accent: "#e2e8f0", border: "#e2e8f0" };
    if (days <= 30) return { label: `${days} days away`, color: "#92400e", accent: "#fef3c7", border: "#fcd34d" };
    if (days <= 90) return { label: `${days} days`, color: "var(--primary-blue)", accent: "var(--bg-secondary)", border: "var(--primary-blue)" };
    return { label: `${days} days`, color: "var(--text-medium)", accent: "transparent", border: "var(--border-light, #e2e8f0)" };
  };

  const handleExport = () => {
    const headers = ["Date", "Category", "Schedule C Line", "Vendor", "Description", "Payment Method", "Amount"];
    const rows = yearExpenses.map((e) => [
      e.expense_date,
      formatCategoryLabel(e.category),
      SCHEDULE_C_MAP[e.category]?.line ?? "Other Expenses — Line 27",
      e.vendor,
      e.description,
      e.payment_method,
      e.amount.toFixed(2),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dductly-tax-summary-${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const businessName = user?.user_metadata?.business_name
    ? user.user_metadata.business_name.endsWith("s")
      ? user.user_metadata.business_name
      : `${user.user_metadata.business_name}'s`
    : "Your";

  const tabStyle = (tab: typeof activeTab) => ({
    padding: "10px 20px",
    border: "none",
    borderBottom: activeTab === tab ? "2px solid var(--primary-blue)" : "2px solid transparent",
    background: "none",
    color: activeTab === tab ? "var(--primary-blue)" : "var(--text-medium)",
    fontWeight: activeTab === tab ? 700 : 500,
    fontSize: "0.95rem",
    cursor: "pointer",
    transition: "all 0.15s ease",
  });

  return (
    <div className="page">
      <section className="section">
        <div className="expenses-container">

          {/* ── Header ── */}
          <div className="expenses-header">
            <button className="back-button" onClick={() => onNavigate("home")}>
              ← Back to Dashboard
            </button>
            <div style={{ textAlign: "center", width: "100%" }}>
              <h1 className="section-title">{businessName} Tax Insights</h1>
              <p className="section-subtitle">
                Everything you need to know for tax season — your data, your deductions, your deadlines.
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "12px" }}>
                <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-medium)", whiteSpace: "nowrap" }}>
                  Tax Year:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="expense-select"
                  style={{ minWidth: "90px" }}
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Disclaimer ── */}
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--primary-blue)",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "24px",
            fontSize: "0.85rem",
            color: "var(--text-medium)",
          }}>
            <strong>Heads up:</strong> This page is for informational purposes only and is not tax advice. All deductions must be ordinary and necessary for your business. Tax laws vary by situation — always consult a qualified tax professional before filing. Based on current IRS guidance for 2025.
          </div>

          {/* ── Tabs ── */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-light, #e2e8f0)", marginBottom: "28px", gap: "4px" }}>
            <button style={tabStyle("snapshot")} onClick={() => setActiveTab("snapshot")}>
              My Tax Snapshot
            </button>
            <button style={tabStyle("guide")} onClick={() => setActiveTab("guide")}>
              Write-off Guide
            </button>
            <button style={tabStyle("deadlines")} onClick={() => setActiveTab("deadlines")}>
              Key Deadlines
            </button>
          </div>

          {/* ══════════════════════════════════════════════
              TAB 1 — MY TAX SNAPSHOT
          ══════════════════════════════════════════════ */}
          {activeTab === "snapshot" && (
            <div>
              {/* No data banner */}
              {yearExpenses.length === 0 && yearIncomes.length === 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", background: "var(--pale-blue)", border: "1.5px solid var(--primary-blue)", borderRadius: "12px", marginBottom: "24px" }}>
                  <span style={{ fontSize: "1.3rem" }}>📭</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-dark)", marginBottom: "2px" }}>No data for {selectedYear}</p>
                    <p style={{ fontSize: "0.83rem", color: "var(--text-medium)" }}>You haven't logged any expenses or income for this year yet. Select a different year or start adding records.</p>
                  </div>
                </div>
              )}

              {/* Summary cards */}
              <div className="expenses-summary" style={{ marginBottom: "28px" }}>
                <div className="summary-card">
                  <div className="summary-label">Revenue ({selectedYear})</div>
                  <div className="summary-value">{formatCurrency(totalIncome)}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Deductible Expenses</div>
                  <div className="summary-value">{formatCurrency(totalDeductible)}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Taxable Net Profit</div>
                  <div
                    className="summary-value"
                    style={{ color: netProfit >= 0 ? "var(--success-green)" : "var(--error-red)" }}
                  >
                    {formatCurrency(netProfit)}
                  </div>
                </div>
              </div>

              {/* Deductibles breakdown */}
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "14px" }}>
                Your Deductibles by Category
              </h2>

              {expensesByCategory.length === 0 ? (
                <div style={{
                  padding: "32px",
                  textAlign: "center",
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-light, #e2e8f0)",
                  borderRadius: "12px",
                  color: "var(--text-medium)",
                  marginBottom: "28px",
                }}>
                  <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📭</div>
                  <p>No expenses logged for {selectedYear} yet.</p>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: "12px" }}
                    onClick={() => onNavigate("add-data")}
                  >
                    Add an Expense
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
                  {expensesByCategory.map(([category, amount]) => {
                    const pct = totalDeductible > 0 ? (amount / totalDeductible) * 100 : 0;
                    const info = SCHEDULE_C_MAP[category];
                    return (
                      <div key={category} style={{
                        background: "var(--card-bg)",
                        border: "1px solid var(--border-light, #e2e8f0)",
                        borderRadius: "12px",
                        padding: "16px 20px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <div>
                            <span className="category-badge">{formatCategoryLabel(category)}</span>
                            {info && (
                              <div style={{ fontSize: "0.78rem", color: "var(--text-light)", marginTop: "5px" }}>
                                Schedule C: {info.line}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "12px" }}>
                            <div style={{ fontWeight: 700, color: "var(--text-dark)" }}>{formatCurrency(amount)}</div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-light)" }}>{pct.toFixed(1)}% of total</div>
                          </div>
                        </div>
                        <div style={{ height: "5px", background: "var(--bg-secondary)", borderRadius: "4px", marginBottom: "10px" }}>
                          <div style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: "var(--primary-blue)",
                            borderRadius: "4px",
                            transition: "width 0.3s ease",
                          }} />
                        </div>
                        {info && (
                          <div style={{ fontSize: "0.83rem", color: "var(--text-medium)", lineHeight: 1.5 }}>
                            {info.tip}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Missing category nudges */}
              {missingCategories.length > 0 && (
                <div style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-light, #e2e8f0)",
                  borderRadius: "12px",
                  padding: "20px",
                  marginBottom: "28px",
                }}>
                  <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "6px" }}>
                    Deductions You Might Be Missing
                  </h2>
                  <p style={{ fontSize: "0.83rem", color: "var(--text-light)", marginBottom: "14px" }}>
                    You haven't logged any {selectedYear} expenses in these common categories:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {missingCategories.map((cat) => {
                      const nudges: Record<string, string> = {
                        travel: "Driving to markets, supplier pickups, or customer deliveries? The 2025 IRS mileage rate is 70¢/mile and every trip adds up.",
                        insurance: "Business insurance premiums — liability, product, general — are fully deductible. Log them if you have coverage.",
                        equipment: "Equipment purchases — from display tables to laptops — may qualify for full deduction under Section 179.",
                        utilities: "A dedicated business phone, internet, or workspace utility bill? The business-use portion is deductible.",
                      };
                      return (
                        <div key={cat} style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                          padding: "12px 14px",
                          background: "var(--bg-secondary)",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          color: "var(--text-medium)",
                          lineHeight: 1.6,
                        }}>
                          <span style={{ fontSize: "1rem", flexShrink: 0 }}>💡</span>
                          <div>
                            <strong style={{ color: "var(--text-dark)" }}>{formatCategoryLabel(cat)}: </strong>
                            {nudges[cat]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Export */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                background: "var(--card-bg)",
                border: "1px solid var(--border-light, #e2e8f0)",
                borderRadius: "12px",
                padding: "20px",
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text-dark)", marginBottom: "4px" }}>
                    Export for Your Accountant
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-medium)" }}>
                    Download a CSV of your {selectedYear} expenses with Schedule C categories already mapped — ready to hand off.
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleExport}
                  disabled={yearExpenses.length === 0}
                >
                  Export {selectedYear} CSV
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 2 — WRITE-OFF GUIDE
          ══════════════════════════════════════════════ */}
          {activeTab === "guide" && (
            <div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-medium)", marginBottom: "22px", lineHeight: 1.6 }}>
                As a self-employed small business owner, you file a <strong>Schedule C</strong> with your Form 1040. Every legitimate business expense reduces your taxable income — and your self-employment tax. To qualify, expenses must be <strong>ordinary and necessary</strong> for your trade or business. Here's what to look for:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                {WRITEOFF_GUIDE.map((item) => (
                  <div key={item.title} style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border-light, #e2e8f0)",
                    borderRadius: "12px",
                    padding: "20px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <span style={{ fontSize: "1.4rem" }}>{item.icon}</span>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-dark)", margin: 0 }}>
                        {item.title}
                      </h3>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-medium)", lineHeight: 1.6, marginBottom: "10px" }}>
                      {item.description}
                    </p>
                    <div style={{
                      fontSize: "0.78rem",
                      color: "var(--text-medium)",
                      background: "var(--bg-secondary)",
                      borderRadius: "6px",
                      padding: "8px 10px",
                      lineHeight: 1.5,
                    }}>
                      <strong>Tip:</strong> {item.note}
                    </div>
                  </div>
                ))}
              </div>

              {/* Self-employment tax note */}
              <div style={{
                marginTop: "24px",
                background: "var(--card-bg)",
                border: "1px solid var(--primary-blue)",
                borderRadius: "12px",
                padding: "20px",
              }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "10px" }}>
                  Don't forget: Self-Employment Tax
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-medium)", lineHeight: 1.6, marginBottom: "10px" }}>
                  Self-employed individuals pay <strong>15.3% SE tax</strong> (Social Security + Medicare) on net profit in addition to income tax. The good news: you can deduct <strong>half of your SE tax</strong> from your gross income.
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-medium)", lineHeight: 1.6 }}>
                  This is why every deduction matters — lowering your net profit reduces both your income tax <em>and</em> your self-employment tax.
                </p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 3 — KEY DEADLINES
          ══════════════════════════════════════════════ */}
          {activeTab === "deadlines" && (
            <div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-medium)", marginBottom: "22px", lineHeight: 1.6 }}>
                Self-employed individuals generally need to pay estimated taxes <strong>four times a year</strong> to avoid underpayment penalties. Here are the key dates for {selectedYear}:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
                {deadlines.map((d) => {
                  const status = getDeadlineStatus(d.date);
                  const dateStr = d.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
                  return (
                    <div key={d.label} style={{
                      background: status.accent !== "transparent" ? status.accent : "var(--card-bg)",
                      border: `1px solid ${status.border}`,
                      borderRadius: "12px",
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "20px",
                            background: d.type === "annual" ? "var(--primary-blue)" : "var(--bg-secondary)",
                            color: d.type === "annual" ? "#fff" : "var(--text-medium)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}>
                            {d.type === "annual" ? "Annual" : "Quarterly"}
                          </span>
                          <strong style={{ fontSize: "0.95rem", color: "var(--text-dark)" }}>{d.label}</strong>
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "var(--text-medium)" }}>{dateStr}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: "2px" }}>{d.description}</div>
                      </div>
                      <div style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: status.color,
                        whiteSpace: "nowrap",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        background: "rgba(0,0,0,0.04)",
                      }}>
                        {status.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* How to pay */}
              <div style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-light, #e2e8f0)",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "16px",
              }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "10px" }}>
                  How to Pay Estimated Taxes
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-medium)", lineHeight: 1.6, marginBottom: "10px" }}>
                  The easiest way to pay is online through the IRS at <strong>IRS.gov/payments</strong> using their Direct Pay system (free, no account needed). You can also use EFTPS, pay by card, or mail a check with Form 1040-ES.
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-medium)", lineHeight: 1.6 }}>
                  A common rule of thumb: set aside <strong>25–30% of net profit</strong> for taxes throughout the year.
                </p>
              </div>

              {/* Safe harbor note */}
              <div style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-light, #e2e8f0)",
                borderRadius: "12px",
                padding: "20px",
              }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "10px" }}>
                  Safe Harbor Rule
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-medium)", lineHeight: 1.6 }}>
                  You can avoid underpayment penalties by paying at least <strong>100% of last year's total tax bill</strong> across your four estimated payments (110% if your prior-year AGI exceeded $150,000). This is called the "safe harbor" rule and removes the guesswork if your income varies.
                </p>
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  );
};

export default TaxInsights;
