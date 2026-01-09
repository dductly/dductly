import React, { useState } from "react";
import { useIncome } from "../contexts/IncomeContext";
import { useAuth } from "../hooks/useAuth";

interface AddIncomeProps {
  onNavigate: (page: string) => void;
}

const AddIncome: React.FC<AddIncomeProps> = ({ onNavigate }) => {
  const { addIncome } = useIncome();
  const { user } = useAuth();
  const businessName = user?.user_metadata?.business_name || "Your";
  const [formData, setFormData] = useState({
    date: "",
    amount: "",
    tip: "",
    category: "",
    customer: "",
    // market: "",
    description: "",
    paymentMethod: "",
  });
  const [otherPaymentMethod, setOtherPaymentMethod] = useState("");
  // const [otherMarket, setOtherMarket] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Add income to shared state
    addIncome({
      income_date: formData.date,
      amount: parseFloat(formData.amount.replace(/,/g, '')),
      tip: formData.tip ? parseFloat(formData.tip.replace(/,/g, '')) : 0,
      category: formData.category,
      customer: formData.customer,
      market: "", // formData.market === "other" ? otherMarket : formData.market,
      description: formData.description,
      payment_method: formData.paymentMethod === "other" ? otherPaymentMethod : formData.paymentMethod,
    });

    setSuccess(true);
    setLoading(false);

    // Reset form
    setFormData({
      date: "",
      amount: "",
      tip: "",
      category: "",
      customer: "",
      // market: "",
      description: "",
      paymentMethod: "",
    });
    setOtherPaymentMethod("");
    // setOtherMarket("");

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

  const handleTipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow digits, one decimal point, and nothing else
    let value = e.target.value.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    setFormData({
      ...formData,
      tip: value,
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
              onClick={() => onNavigate('income')}
              aria-label="Go back to income"
            >
              ← Back to {businessName} Income
            </button>
            <h1 className="section-title">Add Income</h1>
            <p className="section-subtitle">
              Record a new income entry to keep your records up to date
            </p>
          </div>

          {success && (
            <div className="success-banner">
              ✓ Income added successfully!
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
                    name="tip"
                    placeholder="0.00"
                    value={formData.tip}
                    onChange={handleTipChange}
                    onBlur={(e) => {
                      if (e.target.value) {
                        setFormData({ ...formData, tip: formatAmount(e.target.value) });
                      }
                    }}
                    style={{ paddingLeft: '28px' }}
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

            <div className="form-row">
              <div className="form-group">
                <label>Customer</label>
                <input
                  type="text"
                  name="customer"
                  placeholder="Customer name (if applicable)"
                  value={formData.customer}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* <div className="form-group">
                <label>Market</label>
                <select
                  name="market"
                  value={formData.market}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Select market</option>
                  <option value="other">Other</option>
                </select>
              </div> */}
            </div>

            {/* {formData.market === "other" && (
              <div className="form-group">
                <label>Specify Market</label>
                <input
                  type="text"
                  placeholder="Enter market name"
                  value={otherMarket}
                  onChange={(e) => setOtherMarket(e.target.value)}
                  disabled={loading}
                />
              </div>
            )} */}

            <div className="form-group">
              <label>Title</label>
              <textarea
                name="description"
                placeholder="Add a title or additional details about this income..."
                rows={4}
                maxLength={50}
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
              />
              <div style={{ fontSize: '0.85rem', color: formData.description.length >= 50 ? '#c33' : '#999', marginTop: '4px' }}>
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
                {loading ? "Saving..." : "Add Income"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default AddIncome;
