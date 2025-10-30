import React from "react";
import { useAuth } from "../hooks/useAuth";

interface DashboardProps {
  onNavigate: (page: string) => void;
  onFaqClick?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onFaqClick }) => {
  const { user } = useAuth();

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
                View Expenses
              </button>
              <button
                className="btn btn-primary btn-large"
                onClick={() => onNavigate('add-data')}
              >
                Add Expense
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
            <h2 className="card-title">Your Account</h2>
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
                <a href="#" onClick={(e) => { e.preventDefault(); /* Add guide navigation */ }} className="link">
                  User Guide
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
