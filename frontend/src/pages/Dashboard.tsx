import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";

interface DashboardProps {
  onNavigate: (page: string) => void;
  onFaqClick?: () => void;
  onUserGuideClick?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onFaqClick, onUserGuideClick }) => {
  const { user } = useAuth();
  const { expenses } = useExpenses();
  const { incomes } = useIncome();

  // Calculate stats for preview
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
                  <h3>Add Expenses & Income</h3>
                  <p>Log transactions and upload receipts as you go</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Track Your Progress</h3>
                  <p>View statistics and see your profit over time</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Stay Organized</h3>
                  <p>All your finances and receipts in one place</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Preview Card */}
          <div className="dashboard-card stats-preview">
            <div className="stats-preview-header">
              <h2 className="card-title">Statistics</h2>
              <button
                className="btn btn-ghost btn-small"
                onClick={() => onNavigate('stats')}
              >
                View All →
              </button>
            </div>
            <div className="stats-preview-grid">
              <div className="stats-preview-item">
                <span className="stats-preview-label">Total Income</span>
                <span className="stats-preview-value income">{formatCurrency(totalIncome)}</span>
              </div>
              <div className="stats-preview-item">
                <span className="stats-preview-label">Total Expenses</span>
                <span className="stats-preview-value expenses">{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="stats-preview-item">
                <span className="stats-preview-label">Net Profit</span>
                <span className={`stats-preview-value ${netProfit >= 0 ? 'profit' : 'loss'}`}>
                  {formatCurrency(netProfit)}
                </span>
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
    </div>
  );
};

export default Dashboard;
