import React, { useState, useEffect } from "react";
import { useExpenses } from "../contexts/ExpensesContext";
import type { Expense } from "../contexts/ExpensesContext";
import recycleIcon from "../img/recycle.svg";
import menuIcon from "../img/menu.svg";
import editIcon from "../img/pencil-edit.svg";

interface ExpenseProps {
  onNavigate: (page: string) => void;
}

const Expenses: React.FC<ExpenseProps> = ({ onNavigate }) => {
  const { expenses, deleteExpense } = useExpenses();
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState<"expense_date" | "amount">("expense_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [summaryView, setSummaryView] = useState<"overall" | "category" | "month">("overall");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");


  // Calculate total
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // const [summaryView, setSummaryView] = useState<"overall" | "category" | "month">("overall");
  const categoryTotals: Record<string, number> = {};
  const monthTotals: Record<string, number> = {};

  expenses.forEach(expense => {
    // Category totals
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;

    // Month totals
    const month = new Date(expense.expense_date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    monthTotals[month] = (monthTotals[month] || 0) + expense.amount;
  });

  // Filter expenses
  const filteredExpenses = filterCategory
    ? expenses.filter((e) => e.category === filterCategory)
    : expenses;

  // Sort expenses
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortBy === "expense_date") {
      const comparison =
        new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    } else {
      const comparison = a.amount - b.amount;
      return sortOrder === "asc" ? comparison : -comparison;
    }
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(expenses.map((e) => e.category)));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const handleEditExpense = (expense: Expense) => {
    alert(
      `Edit functionality coming soon!\n\nExpense: ${expense.description}\nAmount: ${formatCurrency(
        expense.amount
      )}`
    );
    setOpenMenuId(null);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteExpense(id);
    }
    setOpenMenuId(null);
  };

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest(".menu-wrapper")) {
          setOpenMenuId(null);
        }
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  return (
    <div className="page">
      <section className="section">
        <div className="expenses-container">
          <div className="expenses-header">
            <button className="back-button" onClick={() => onNavigate("home")}>
              ← Back to Dashboard
            </button>
            <h1 className="section-title">Your Expenses</h1>
            <p className="section-subtitle">
              Track and manage all your business expenses in one place
            </p>
          </div>

          <div className="expenses-summary">
            <div className="control-group">
              <label>View Totals By:</label>
              <select
                value={summaryView}
                onChange={(e) => setSummaryView(e.target.value as "overall" | "category" | "month")}
                className="expense-select"
              >
                <option value="overall">Overall</option>
                <option value="category">Category</option>
                <option value="month">Month</option>
              </select>
            </div>

            {summaryView === "category" && (
              <div className="control-group">
                <label>Select Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="expense-select"
                >
                  <option value="">All Categories</option>
                  {Object.keys(categoryTotals).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {summaryView === "month" && (
              <div className="control-group">
                <label>Select Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="expense-select"
                >
                  <option value="">All Months</option>
                  {Object.keys(monthTotals).map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="summary-card">
              <div className="summary-label">
                {summaryView === "overall" && "Total Expenses"}
                {summaryView === "category" && `Total for ${selectedCategory || "All Categories"}`}
                {summaryView === "month" && `Total for ${selectedMonth || "All Months"}`}
              </div>
              <div className="summary-value">
                {formatCurrency(
                  summaryView === "overall"
                    ? totalExpenses
                    : summaryView === "category"
                    ? selectedCategory
                      ? categoryTotals[selectedCategory] || 0
                      : Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)
                    : selectedMonth
                    ? monthTotals[selectedMonth] || 0
                    : Object.values(monthTotals).reduce((sum, val) => sum + val, 0)
                )}
              </div>
            </div>
          </div>

          <div className="expenses-controls">
            <div className="control-group">
              <label>Filter by Category:</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="expense-select"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "expense_date" | "amount")
                }
                className="expense-select"
              >
                <option value="expense_date">Date</option>
                <option value="amount">Amount</option>
              </select>
            </div>

            <div className="control-group">
              <label>Order:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="expense-select"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>

            <button className="btn btn-primary" onClick={() => onNavigate("add-data")}>
              + Add Expense
            </button>
          </div>

          <div className="expenses-table-container">
            {sortedExpenses.length > 0 ? (
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Vendor</th>
                    <th>Description</th>
                    <th>Payment Method</th>
                    <th className="amount-column">Amount</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{formatDate(expense.expense_date)}</td>
                      <td>
                        <span className="category-badge">{expense.category}</span>
                      </td>
                      <td>{expense.vendor}</td>
                      <td>{expense.description}</td>
                      <td>{expense.payment_method}</td>
                      <td>{formatCurrency(expense.amount)}</td>
                      <td>
                        <div className="menu-wrapper">
                          <button
                            className="menu-btn"
                            onClick={() => toggleMenu(expense.id)}
                          >
                            <img src={menuIcon} alt="Menu" className="menu-icon" />
                          </button>
                          {openMenuId === expense.id && (
                            <div className="dropdown-menu">
                              <button
                                className="dropdown-item"
                                onClick={() => handleEditExpense(expense)}
                              >
                                <img
                                  src={editIcon}
                                  alt="Edit"
                                  className="dropdown-icon"
                                />
                                Edit
                              </button>
                              <button
                                className="dropdown-item delete-item"
                                onClick={() => handleDeleteExpense(expense.id)}
                              >
                                <img
                                  src={recycleIcon}
                                  alt="Delete"
                                  className="dropdown-icon"
                                />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-expenses">
                <p>No expenses found for the selected category.</p>
                <button
                  className="btn btn-primary btn-large"
                  onClick={() => onNavigate("add-data")}
                >
                  Add Your First Expense
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Expenses;
