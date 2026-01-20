import React, { useState } from "react";
import { useExpenses } from "../contexts/ExpensesContext";
import { useAuth } from "../hooks/useAuth";

interface AddDataProps {
  onNavigate: (page: string) => void;
}

const AddData: React.FC<AddDataProps> = ({ onNavigate }) => {
  const { addExpense } = useExpenses();
  const { user } = useAuth();
  const businessName = user?.user_metadata?.business_name
    ? (user.user_metadata.business_name.endsWith('s')
      ? user.user_metadata.business_name
      : `${user.user_metadata.business_name}'s`)
    : "Your";
  const [formData, setFormData] = useState({
    date: "",
    amount: "",
    category: "",
    vendor: "",
    description: "",
    paymentMethod: "",
  });
  const [otherPaymentMethod, setOtherPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Add expense to shared state
    addExpense({
      expense_date: formData.date,
      amount: parseFloat(formData.amount.replace(/,/g, '')),
      category: formData.category,
      vendor: formData.vendor,
      description: formData.description,
      payment_method: formData.paymentMethod === "other" ? otherPaymentMethod : formData.paymentMethod,
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
    setOtherPaymentMethod("");

    // Hide success message after 3 seconds
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow digits, one decimal point, and nothing else
    let value = e.target.value.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    setFormData({
      ...formData,
      amount: value,
    });
  };

  const formatAmount = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="page">
      <section className="section">
        <div className="add-data-container">
          <div className="add-data-header">
            <button
              className="back-button"
              onClick={() => onNavigate('expenses')}
              aria-label="Go back to expenses"
            >
              ← Back to {businessName} Expenses
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
                    name="amount"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    onBlur={(e) => {
                      if (e.target.value) {
                        setFormData({ ...formData, amount: formatAmount(e.target.value) });
                      }
                    }}
                    style={{ paddingLeft: '28px' }}
                    required
                    disabled={loading}
                  />
                </div>
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
                  <option value="venmo">Venmo</option>
                  <option value="check">Check</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {formData.paymentMethod === "other" && (
              <div className="form-group">
                <label>Specify Payment Method</label>
                <input
                  type="text"
                  placeholder="Enter payment method"
                  value={otherPaymentMethod}
                  onChange={(e) => setOtherPaymentMethod(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

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
              <label>Title</label>
              <textarea
                name="description"
                placeholder="Add a title or additional details about this expense..."
                rows={4}
                maxLength={50}
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
              />
              <div style={{ fontSize: '0.85rem', color: formData.description.length >= 50 ? 'var(--error-red)' : 'var(--text-light)', marginTop: '4px' }}>
                {formData.description.length}/50 characters
              </div>
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
