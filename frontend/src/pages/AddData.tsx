import React, { useState } from "react";
import { useExpenses } from "../contexts/ExpensesContext";

interface AddDataProps {
  onNavigate: (page: string) => void;
}

const AddData: React.FC<AddDataProps> = ({ onNavigate }) => {
  const { addExpense } = useExpenses();
  const [formData, setFormData] = useState({
    date: "",
    amount: "",
    category: "",
    vendor: "",
    description: "",
    paymentMethod: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Add expense to shared state
    addExpense({
      date: formData.date,
      amount: parseFloat(formData.amount),
      category: formData.category,
      vendor: formData.vendor,
      description: formData.description,
      paymentMethod: formData.paymentMethod,
    });

    setSuccess(true);
    setLoading(false);

    // Reset form
    setFormData({
      date: "",
      amount: "",
      category: "",
      vendor: "",
      description: "",
      paymentMethod: "",
    });

    // Hide success message after 3 seconds
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="page">
      <section className="section">
        <div className="add-data-container">
          <div className="add-data-header">
            <button
              className="back-button"
              onClick={() => onNavigate('home')}
              aria-label="Go back to dashboard"
            >
              ← Back to Dashboard
            </button>
            <h1 className="section-title">Add Expense</h1>
            <p className="section-subtitle">
              Manually enter a new expense to keep your records up to date
            </p>
          </div>

          {success && (
            <div className="success-banner">
              ✓ Expense added successfully!
            </div>
          )}

          <form className="add-data-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Date <span className="req">(required)</span></label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Amount <span className="req">(required)</span></label>
                <input
                  type="number"
                  name="amount"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category <span className="req">(required)</span></label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  disabled={loading}
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
                <label>Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Select payment method</option>
                  <option value="cash">Cash</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="debit-card">Debit Card</option>
                  <option value="check">Check</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Vendor/Store Name</label>
              <input
                type="text"
                name="vendor"
                placeholder="Where did you make this purchase?"
                value={formData.vendor}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Description/Notes</label>
              <textarea
                name="description"
                placeholder="Add any additional details about this expense..."
                rows={4}
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-ghost btn-large"
                onClick={() => onNavigate('home')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={loading}
              >
                {loading ? "Saving..." : "Add Expense"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default AddData;
