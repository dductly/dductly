import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import editIcon from "../img/pencil-edit.svg";

interface DashboardProps {
  onNavigate: (page: string) => void;
  onFaqClick?: () => void;
  onUserGuideClick?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onFaqClick, onUserGuideClick }) => {
  const { user, updateProfile, refreshSession } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.user_metadata?.first_name || "",
    lastName: user?.user_metadata?.last_name || "",
    email: user?.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditClick = () => {
    setProfileForm({
      firstName: user?.user_metadata?.first_name || "",
      lastName: user?.user_metadata?.last_name || "",
      email: user?.email || "",
    });
    setIsEditingProfile(true);
    setError(null);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);

    const emailChanged = profileForm.email !== user?.email;

    const { error } = await updateProfile(
      profileForm.firstName,
      profileForm.lastName,
      profileForm.email
    );

    if (error) {
      setError(error.message);
    } else {
      setIsEditingProfile(false);
      if (emailChanged) {
        alert("Profile updated! A confirmation email has been sent to your new email address. Please verify it and then refresh this page to see the changes.");
      } else {
        // Only reload for name changes (immediate effect)
        window.location.reload();
      }
    }

    setLoading(false);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setError(null);
  };

  return (
    <div className="page">
      <section className="section dashboard">
        <div className="dashboard-header">
          <h1 className="section-title">
            Welcome back, {user?.user_metadata?.first_name || 'there'}!
          </h1>
          <p className="section-subtitle">
            Ready to make your business management effortless? Let's get started.
          </p>
        </div>

        <div className="dashboard-grid">
          {/* Quick Actions Card */}
          <div className="dashboard-card quick-actions">
            <h2 className="card-title">Quick Actions</h2>
            <div className="action-buttons">
              <button
                className="btn btn-primary btn-large"
                onClick={() => onNavigate('expenses')}
              >
                Expenses
              </button>
              <button
                className="btn btn-primary btn-large"
                onClick={() => onNavigate('income')}
              >
                Income
              </button>
              <button
                className="btn btn-primary btn-large"
                onClick={() => onNavigate('import')}
              >
                Import Data
              </button>
            </div>
          </div>

          {/* Getting Started Card */}
          <div className="dashboard-card getting-started">
            <h2 className="card-title">Getting Started</h2>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Import Your Data</h3>
                  <p>Upload your expenses and receipts to get organized</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Track Everything</h3>
                  <p>Keep all your market expenses in one place</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Export at Tax Time</h3>
                  <p>Generate reports with just one click</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Overview Card */}
          <div className="dashboard-card account-overview">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card-title">Your Account</h2>
              <button
                className="icon-btn"
                onClick={handleEditClick}
                aria-label="Edit profile"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
              >
                <img src={editIcon} alt="Edit" style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <div className="account-info">
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">
                  {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email}</span>
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-medium)' }}>
                Changed your email?{' '}
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); refreshSession(); }}
                  className="link"
                  style={{ color: 'var(--primary-purple)', fontWeight: 600 }}
                >
                  Click here to refresh
                </a>
              </div>
            </div>
          </div>

          {/* Resources Card */}
          <div className="dashboard-card resources">
            <h2 className="card-title">Resources</h2>
            <ul className="resource-list">
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('contact'); }} className="link">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); onFaqClick?.(); }} className="link">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); onUserGuideClick?.(); }} className="link">
                  User Guide
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="modal-close" onClick={handleCancelEdit}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="error-message" style={{ marginBottom: '16px', padding: '12px', background: '#fee', color: '#c33', borderRadius: '8px' }}>
                  {error}
                </div>
              )}
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, firstName: e.target.value })
                  }
                  className="form-input"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, lastName: e.target.value })
                  }
                  className="form-input"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className="form-input"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCancelEdit} disabled={loading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveProfile} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
