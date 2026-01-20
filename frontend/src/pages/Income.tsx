import React, { useState, useEffect } from "react";
import { useIncome } from "../contexts/IncomeContext";
import { useExpenses } from "../contexts/ExpensesContext";
import { useAuth } from "../hooks/useAuth";
import type { Income } from "../contexts/IncomeContext";
import recycleIcon from "../img/recycle.svg";
import menuIcon from "../img/menu.svg";
import editIcon from "../img/pencil-edit.svg";
import viewIcon from "../img/open-eye.svg";

interface IncomeProps {
  onNavigate: (page: string) => void;
}

const IncomePage: React.FC<IncomeProps> = ({ onNavigate }) => {
  const { incomes, updateIncome, deleteIncome } = useIncome();
  const { expenses } = useExpenses();
  const { user } = useAuth();
  const businessName = user?.user_metadata?.business_name
    ? (user.user_metadata.business_name.endsWith('s')
      ? user.user_metadata.business_name
      : `${user.user_metadata.business_name}'s`)
    : "Your";
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState<"income_date" | "amount">("income_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [viewingIncome, setViewingIncome] = useState<Income | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editForm, setEditForm] = useState({
    income_date: "",
    category: "",
    customer: "",
    // market: "",
    description: "",
    payment_method: "",
    amount: "",
    tip: "",
  });
  const [otherPaymentMethod, setOtherPaymentMethod] = useState("");
  // const [otherMarket, setOtherMarket] = useState("");

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount + (income.tip || 0), 0);
  const totalProfit = totalIncome - totalExpenses;

  // Filter incomes
  const filteredIncomes = filterCategory
    ? incomes.filter((i) => i.category === filterCategory)
    : incomes;

  // Sort incomes
  const sortedIncomes = [...filteredIncomes].sort((a, b) => {
    if (sortBy === "income_date") {
      const comparison =
        new Date(a.income_date).getTime() - new Date(b.income_date).getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    } else {
      const totalA = a.amount + (a.tip || 0);
      const totalB = b.amount + (b.tip || 0);
      const comparison = totalA - totalB;
      return sortOrder === "asc" ? comparison : -comparison;
    }
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(incomes.map((i) => i.category)));

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

  const handleTipChange = (value: string) => {
    // Remove commas and allow digits, one decimal point, and nothing else
    let cleanValue = value.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }

    setEditForm({ ...editForm, tip: cleanValue });
  };

  const handleViewIncome = (income: Income) => {
    setViewingIncome(income);
    setOpenMenuId(null);
  };

  const handleCloseView = () => {
    setViewingIncome(null);
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setEditForm({
      income_date: income.income_date,
      category: income.category,
      customer: income.customer,
      // market: income.market,
      description: income.description,
      payment_method: income.payment_method,
      amount: income.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      tip: income.tip ? income.tip.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00",
    });
    setOpenMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (editingIncome) {
      await updateIncome(editingIncome.id, {
        ...editForm,
        market: "", // editForm.market === "other" ? otherMarket : editForm.market,
        payment_method: editForm.payment_method === "other" ? otherPaymentMethod : editForm.payment_method,
        amount: parseFloat(editForm.amount.replace(/,/g, '')),
        tip: editForm.tip ? parseFloat(editForm.tip.replace(/,/g, '')) : 0,
      });
      setEditingIncome(null);
      setOtherPaymentMethod("");
      // setOtherMarket("");
    }
  };

  const handleCancelEdit = () => {
    setEditingIncome(null);
    setEditForm({
      income_date: "",
      category: "",
      customer: "",
      // market: "",
      description: "",
      payment_method: "",
      amount: "",
      tip: "",
    });
    setOtherPaymentMethod("");
    // setOtherMarket("");
  };

  const handleDeleteIncome = (id: string) => {
    if (window.confirm("Are you sure you want to delete this income entry?")) {
      deleteIncome(id);
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
      const menuHeight = 100; // Approximate height of compact dropdown menu

      // If we're near the top (less than 350px from top), force dropdown to open downward
      // This accounts for page header, summary cards, and table header
      // Otherwise, open upward if there's more space above
      if (spaceAbove < 350) {
        setMenuCoords({ top: rect.bottom + 4, left: rect.right - 120 });
      } else if (spaceAbove > spaceBelow) {
        setMenuCoords({ top: rect.top - menuHeight - 4, left: rect.right - 120 });
      } else {
        setMenuCoords({ top: rect.bottom + 4, left: rect.right - 120 });
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
            <h1 className="section-title">{businessName} Income</h1>
            <p className="section-subtitle">
              Track and manage all your business income in one place
            </p>
          </div>

          <div className="expenses-summary">
            <div className="summary-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('expenses')}>
              <div className="summary-label">Total Expenses</div>
              <div className="summary-value">{formatCurrency(totalExpenses)}</div>
            </div>
            <div className="summary-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('add-income')}>
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
                  setSortBy(e.target.value as "income_date" | "amount")
                }
                className="expense-select"
              >
                <option value="income_date">Date</option>
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

            <button className="btn btn-primary" onClick={() => onNavigate("add-income")}>
              + Add Income
            </button>
          </div>

          <div className="expenses-table-container">
            {sortedIncomes.length > 0 ? (
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Customer</th>
                    {/* <th>Market</th> */}
                    <th>Title</th>
                    <th>Payment Method</th>
                    <th className="amount-column">Amount</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedIncomes.map((income) => (
                    <tr key={income.id}>
                      <td>{formatDate(income.income_date)}</td>
                      <td>
                        <span className="category-badge">{income.category}</span>
                      </td>
                      <td>{income.customer}</td>
                      {/* <td>{income.market}</td> */}
                      <td>{income.description}</td>
                      <td>{income.payment_method}</td>
                      <td>{formatCurrency(income.amount + (income.tip || 0))}</td>
                      <td>
                        <div className="menu-wrapper">
                          <button
                            className="menu-btn"
                            onClick={(e) => toggleMenu(income.id, e)}
                          >
                            <img src={menuIcon} alt="Menu" className="menu-icon" />
                          </button>
                          {openMenuId === income.id && (
                            <div
                              className="dropdown-menu"
                              style={{
                                position: 'fixed',
                                top: menuCoords.top,
                                left: menuCoords.left,
                              }}
                            >
                              <button
                                className="dropdown-item"
                                onClick={() => handleViewIncome(income)}
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
                                onClick={() => handleEditIncome(income)}
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
                                onClick={() => handleDeleteIncome(income.id)}
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
                <p>No income entries found for the selected category.</p>
                <button
                  className="btn btn-primary btn-large"
                  onClick={() => onNavigate("add-income")}
                >
                  Add Your First Income Entry
                </button>
              </div>
            )}
          </div>

          {viewingIncome && (
            <div className="modal-overlay" onClick={handleCloseView}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>View Income</h2>
                  <button className="modal-close" onClick={handleCloseView}>
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Date</label>
                    <div className="form-input" style={{ backgroundColor: 'var(--off-white)', cursor: 'default' }}>
                      {formatDate(viewingIncome.income_date)}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <div className="form-input" style={{ backgroundColor: 'var(--off-white)', cursor: 'default' }}>
                      {viewingIncome.category}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Customer</label>
                    <div className="form-input" style={{ backgroundColor: 'var(--off-white)', cursor: 'default' }}>
                      {viewingIncome.customer}
                    </div>
                  </div>
                  {/* <div className="form-group">
                    <label>Market</label>
                    <div className="form-input" style={{ backgroundColor: 'var(--off-white)', cursor: 'default' }}>
                      {viewingIncome.market}
                    </div>
                  </div> */}
                  <div className="form-group">
                    <label>Title</label>
                    <div className="form-input" style={{ backgroundColor: 'var(--off-white)', cursor: 'default', minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                      {viewingIncome.description}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Payment Method</label>
                    <div className="form-input" style={{ backgroundColor: 'var(--off-white)', cursor: 'default' }}>
                      {viewingIncome.payment_method}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <div className="form-input" style={{ backgroundColor: 'var(--off-white)', cursor: 'default' }}>
                      {formatCurrency(viewingIncome.amount)}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Tip</label>
                    <div className="form-input" style={{ backgroundColor: 'var(--off-white)', cursor: 'default' }}>
                      {formatCurrency(viewingIncome.tip || 0)}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Total</label>
                    <div className="form-input" style={{ backgroundColor: 'var(--off-white)', cursor: 'default', fontWeight: 'bold' }}>
                      {formatCurrency(viewingIncome.amount + (viewingIncome.tip || 0))}
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

          {editingIncome && (
            <div className="modal-overlay" onClick={handleCancelEdit}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Edit Income</h2>
                  <button className="modal-close" onClick={handleCancelEdit}>
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={editForm.income_date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, income_date: e.target.value })
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
                      <option value="product-sales">Product Sales</option>
                      <option value="services">Services</option>
                      <option value="consulting">Consulting</option>
                      <option value="grants">Grants</option>
                      <option value="investments">Investments</option>
                      <option value="refunds">Refunds</option>
                      <option value="commissions">Commissions</option>
                      <option value="royalties">Royalties</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Customer</label>
                    <input
                      type="text"
                      value={editForm.customer}
                      onChange={(e) =>
                        setEditForm({ ...editForm, customer: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>
                  {/* <div className="form-group">
                    <label>Market</label>
                    <select
                      value={editForm.market}
                      onChange={(e) =>
                        setEditForm({ ...editForm, market: e.target.value })
                      }
                      className="form-input"
                    >
                      <option value="">Select market</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {editForm.market === "other" && (
                    <div className="form-group">
                      <label>Specify Market</label>
                      <input
                        type="text"
                        placeholder="Enter market name"
                        value={otherMarket}
                        onChange={(e) => setOtherMarket(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  )} */}
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
                  <div className="form-group">
                    <label>Tip</label>
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
                        value={editForm.tip}
                        onChange={(e) => handleTipChange(e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value) {
                            setEditForm({ ...editForm, tip: formatAmount(e.target.value) });
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

export default IncomePage;
