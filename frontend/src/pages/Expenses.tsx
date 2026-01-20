import React, { useState, useEffect } from "react";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";
import { useAuth } from "../hooks/useAuth";
import type { Expense } from "../contexts/ExpensesContext";
import recycleIcon from "../img/recycle.svg";
import menuIcon from "../img/menu.svg";
import editIcon from "../img/pencil-edit.svg";
import viewIcon from "../img/open-eye.svg";

interface ExpenseProps {
  onNavigate: (page: string) => void;
}

const Expenses: React.FC<ExpenseProps> = ({ onNavigate }) => {
  const { expenses, updateExpense, deleteExpense } = useExpenses();
  const { incomes } = useIncome();
  const { user } = useAuth();
  const businessName = user?.user_metadata?.business_name
    ? (user.user_metadata.business_name.endsWith('s')
      ? user.user_metadata.business_name
      : `${user.user_metadata.business_name}'s`)
    : "Your";
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState<"expense_date" | "amount">("expense_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<"top" | "bottom">("top");
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState({
    expense_date: "",
    category: "",
    vendor: "",
    description: "",
    payment_method: "",
    amount: "",
  });
  const [otherPaymentMethod, setOtherPaymentMethod] = useState("");

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalProfit = totalIncome - totalExpenses;

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
    // Parse the date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const formatAmount = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAmountChange = (value: string) => {
    // Remove commas and allow digits, one decimal point, and nothing else
    let cleanValue = value.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }

    setEditForm({ ...editForm, amount: cleanValue });
  };

  const handleViewExpense = (expense: Expense) => {
    setViewingExpense(expense);
    setOpenMenuId(null);
  };

  const handleCloseView = () => {
    setViewingExpense(null);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setEditForm({
      expense_date: expense.expense_date,
      category: expense.category,
      vendor: expense.vendor,
      description: expense.description,
      payment_method: expense.payment_method,
      amount: expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });
    setOpenMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, {
        ...editForm,
        payment_method: editForm.payment_method === "other" ? otherPaymentMethod : editForm.payment_method,
        amount: parseFloat(editForm.amount.replace(/,/g, '')),
      });
      setEditingExpense(null);
      setOtherPaymentMethod("");
    }
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setEditForm({
      expense_date: "",
      category: "",
      vendor: "",
      description: "",
      payment_method: "",
      amount: "",
    });
    setOtherPaymentMethod("");
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteExpense(id);
    }
    setOpenMenuId(null);
  };

  const toggleMenu = (id: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      // Calculate position to determine if menu should open up or down
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // If we're near the top (less than 350px from top), force dropdown to open downward
      // This accounts for page header, summary cards, and table header
      // Otherwise, open upward if there's more space above
      if (spaceAbove < 350) {
        setMenuPosition("bottom");
      } else if (spaceAbove > spaceBelow) {
        setMenuPosition("top");
      } else {
        setMenuPosition("bottom");
      }

      setOpenMenuId(id);
    }
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
            <h1 className="section-title">{businessName} Expenses</h1>
            <p className="section-subtitle">
              Track and manage all your business expenses in one place
            </p>
          </div>

          <div className="expenses-summary">
            <div className="summary-card">
              <div className="summary-label">Total Expenses</div>
              <div className="summary-value">{formatCurrency(totalExpenses)}</div>
            </div>
            <div className="summary-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('income')}>
              <div className="summary-label">Total Income</div>
              <div className="summary-value">{formatCurrency(totalIncome)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Profit</div>
              <div className="summary-value">{formatCurrency(totalProfit)}</div>
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
                    <th>Title</th>
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
                            onClick={(e) => toggleMenu(expense.id, e)}
                          >
                            <img src={menuIcon} alt="Menu" className="menu-icon" />
                          </button>
                          {openMenuId === expense.id && (
                            <div className={`dropdown-menu dropdown-menu-${menuPosition}`}>
                              <button
                                className="dropdown-item"
                                onClick={() => handleViewExpense(expense)}
                              >
                                <img
                                  src={viewIcon}
                                  alt="View"
                                  className="dropdown-icon"
                                />
                                View
                              </button>
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

          {viewingExpense && (
            <div className="modal-overlay" onClick={handleCloseView}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>View Expense</h2>
                  <button className="modal-close" onClick={handleCloseView}>
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Date</label>
                    <div className="form-input" style={{ backgroundColor: 'var(--off-white)', cursor: 'default' }}>
                      {formatDate(viewingExpense.expense_date)}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <div className="form-input" style={{ backgroundColor: 'var(--off-white)', cursor: 'default' }}>
                      {viewingExpense.category}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Vendor</label>
                    <div className="form-input" style={{ backgroundColor: 'var(--off-white)', cursor: 'default' }}>
                      {viewingExpense.vendor}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <div className="form-input" style={{ backgroundColor: 'var(--off-white)', cursor: 'default', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                      {viewingExpense.description}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Payment Method</label>
                    <div className="form-input" style={{ backgroundColor: 'var(--off-white)', cursor: 'default' }}>
                      {viewingExpense.payment_method}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <div className="form-input" style={{ backgroundColor: 'var(--off-white)', cursor: 'default', fontWeight: 'bold' }}>
                      {formatCurrency(viewingExpense.amount)}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={handleCloseView}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {editingExpense && (
            <div className="modal-overlay" onClick={handleCancelEdit}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Edit Expense</h2>
                  <button className="modal-close" onClick={handleCancelEdit}>
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={editForm.expense_date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, expense_date: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                      className="form-input"
                    >
                      <option value="">Select a category</option>
                      <option value="booth-fees">Booth Fees</option>
                      <option value="supplies">Supplies</option>
                      <option value="materials">Materials</option>
                      <option value="equipment">Equipment</option>
                      <option value="travel">Travel</option>
                      <option value="marketing">Marketing</option>
                      <option value="packaging">Packaging</option>
                      <option value="utilities">Utilities</option>
                      <option value="insurance">Insurance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Vendor</label>
                    <input
                      type="text"
                      value={editForm.vendor}
                      onChange={(e) =>
                        setEditForm({ ...editForm, vendor: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({ ...editForm, description: e.target.value })
                      }
                      className="form-input"
                      maxLength={50}
                      rows={3}
                    />
                    <div style={{ fontSize: '0.85rem', color: editForm.description.length >= 50 ? 'var(--error-red)' : 'var(--text-light)', marginTop: '4px' }}>
                      {editForm.description.length}/50 characters
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Payment Method</label>
                    <select
                      value={editForm.payment_method}
                      onChange={(e) =>
                        setEditForm({ ...editForm, payment_method: e.target.value })
                      }
                      className="form-input"
                    >
                      <option value="">Select payment method</option>
                      <option value="cash">Cash</option>
                      <option value="credit-card">Credit Card</option>
                      <option value="debit-card">Debit Card</option>
                      <option value="venmo">Venmo</option>
                      <option value="check">Check</option>
                      <option value="bank-transfer">Bank Transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {editForm.payment_method === "other" && (
                    <div className="form-group">
                      <label>Specify Payment Method</label>
                      <input
                        type="text"
                        placeholder="Enter payment method"
                        value={otherPaymentMethod}
                        onChange={(e) => setOtherPaymentMethod(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Amount</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: 'var(--text-dark)',
                        fontSize: '1rem'
                      }}>
                        $
                      </span>
                      <input
                        type="text"
                        placeholder="0.00"
                        value={editForm.amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value) {
                            setEditForm({ ...editForm, amount: formatAmount(e.target.value) });
                          }
                        }}
                        className="form-input"
                        style={{ paddingLeft: '28px' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSaveEdit}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Expenses;
