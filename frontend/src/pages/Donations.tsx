import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Donation {
  id: string;
  amount: number;
  recipient: string;
  date: string;
  createdAt: string;
}

const Donations: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    recipient: '',
    date: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    // Check if user is logged in
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      window.location.href = '/';
      return;
    }

    // Load donations from localStorage
    const savedDonations = localStorage.getItem('donations');
    if (savedDonations) {
      setDonations(JSON.parse(savedDonations));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.recipient || !formData.date) {
      setMessage({ text: 'Please fill in all fields', type: 'error' });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setMessage({ text: 'Please enter a valid donation amount', type: 'error' });
      return;
    }

    const newDonation: Donation = {
      id: Date.now().toString(),
      amount: amount,
      recipient: formData.recipient.trim(),
      date: formData.date,
      createdAt: new Date().toISOString()
    };

    const updatedDonations = [...donations, newDonation];
    setDonations(updatedDonations);
    localStorage.setItem('donations', JSON.stringify(updatedDonations));

    setFormData({ amount: '', recipient: '', date: '' });
    setMessage({ text: 'Donation added successfully!', type: 'success' });

    // Clear success message after 3 seconds
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
  };

  const deleteDonation = (id: string) => {
    const updatedDonations = donations.filter(donation => donation.id !== id);
    setDonations(updatedDonations);
    localStorage.setItem('donations', JSON.stringify(updatedDonations));
  };

  const totalDonated = donations.reduce((sum, donation) => sum + donation.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="donations-page">
      <header className="nav-wrap">
        <nav className="nav" aria-label="Main">
          <Link className="brand" to="/">
            <img src="/duck.svg" alt="dductly logo" className="brand-logo" />
            dductly
          </Link>
          <div className="menu">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/donations" className="active">Donations</Link>
          </div>
        </nav>
      </header>

      <main className="donations-main">
        <div className="donations-container">
          <div className="donations-header">
            <h1>Donation Tracker</h1>
            <p>Keep track of your charitable donations for tax purposes and personal records.</p>
          </div>

          <div className="donations-content">
            <div className="donation-form-section">
              <h2>Add New Donation</h2>
              <form onSubmit={handleSubmit} className="donation-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="amount">Amount ($)</label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="recipient">Donated To</label>
                  <input
                    type="text"
                    id="recipient"
                    name="recipient"
                    value={formData.recipient}
                    onChange={handleChange}
                    placeholder="e.g., Red Cross, Local Food Bank, etc."
                    required
                  />
                </div>

                {message.text && (
                  <div className={`message ${message.type}`}>
                    {message.text}
                  </div>
                )}

                <button type="submit" className="btn btn-primary">
                  Add Donation
                </button>
              </form>
            </div>

            <div className="donations-summary">
              <div className="summary-card">
                <h3>Total Donated</h3>
                <div className="total-amount">{formatCurrency(totalDonated)}</div>
                <div className="donation-count">{donations.length} donation{donations.length !== 1 ? 's' : ''}</div>
              </div>
            </div>

            <div className="donations-list-section">
              <h2>Your Donations</h2>
              {donations.length === 0 ? (
                <div className="empty-state">
                  <p>No donations recorded yet. Add your first donation above!</p>
                </div>
              ) : (
                <div className="donations-list">
                  {donations
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((donation) => (
                    <div key={donation.id} className="donation-item">
                      <div className="donation-main">
                        <div className="donation-amount">{formatCurrency(donation.amount)}</div>
                        <div className="donation-details">
                          <div className="donation-recipient">{donation.recipient}</div>
                          <div className="donation-date">{formatDate(donation.date)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteDonation(donation.id)}
                        className="delete-button"
                        aria-label="Delete donation"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Donations;