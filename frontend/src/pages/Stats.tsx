import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";

interface StatsProps {
  onNavigate: (page: string) => void;
}

const Stats: React.FC<StatsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { expenses } = useExpenses();
  const { incomes } = useIncome();

  const businessName = user?.user_metadata?.business_name
    ? (user.user_metadata.business_name.endsWith('s')
      ? user.user_metadata.business_name
      : `${user.user_metadata.business_name}'s`)
    : "Your Business";

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate total income
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

  // Calculate net profit
  const netProfit = totalIncome - totalExpenses;

  // Get expense categories breakdown
  const expensesByCategory: Record<string, number> = {};
  expenses.forEach(expense => {
    if (expensesByCategory[expense.category]) {
      expensesByCategory[expense.category] += expense.amount;
    } else {
      expensesByCategory[expense.category] = expense.amount;
    }
  });

  // Get income categories breakdown
  const incomesByCategory: Record<string, number> = {};
  incomes.forEach(inc => {
    if (incomesByCategory[inc.category]) {
      incomesByCategory[inc.category] += inc.amount;
    } else {
      incomesByCategory[inc.category] = inc.amount;
    }
  });

  // Calculate income by month to find best month
  const incomeByMonth: Record<string, number> = {};
  incomes.forEach(inc => {
    const date = new Date(inc.income_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (incomeByMonth[monthKey]) {
      incomeByMonth[monthKey] += inc.amount;
    } else {
      incomeByMonth[monthKey] = inc.amount;
    }
  });

  // Find best month
  let bestMonth = '';
  let bestMonthAmount = 0;
  Object.entries(incomeByMonth).forEach(([month, amount]) => {
    if (amount > bestMonthAmount) {
      bestMonthAmount = amount;
      bestMonth = month;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatMonth = (monthKey: string) => {
    if (!monthKey) return 'N/A';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="page">
      <section className="section">
        <div className="expenses-container">
          <div className="expenses-header">
            <button className="back-button" onClick={() => onNavigate("home")}>
              ← Back to Dashboard
            </button>
            <h1 className="section-title">{businessName} Statistics</h1>
            <p className="section-subtitle">
              Overview of your financial performance
            </p>
          </div>

          <div className="stats-page-grid">
            {/* Total Income Card */}
            <div className="stat-card-uniform">
              <h3 className="stat-card-label">Total Income</h3>
              <p className="stat-card-value" style={{ color: 'var(--primary-purple)' }}>{formatCurrency(totalIncome)}</p>
              <p className="stat-card-subtitle">{incomes.length} entries</p>
            </div>

            {/* Net Profit Card */}
            <div className="stat-card-uniform">
              <h3 className="stat-card-label">Net Profit</h3>
              <p className="stat-card-value" style={{ color: netProfit >= 0 ? '#66BB6A' : '#EF9A9A' }}>{formatCurrency(netProfit)}</p>
              <p className="stat-card-subtitle">{netProfit >= 0 ? 'Profitable' : 'Loss'}</p>
            </div>

            {/* Total Expenses Card */}
            <div className="stat-card-uniform">
              <h3 className="stat-card-label">Total Expenses</h3>
              <p className="stat-card-value" style={{ color: '#EF9A9A' }}>{formatCurrency(totalExpenses)}</p>
              <p className="stat-card-subtitle">{expenses.length} entries</p>
            </div>

            {/* Best Month Card */}
            <div className="stat-card-uniform">
              <h3 className="stat-card-label">Best Month</h3>
              <p className="stat-card-value" style={{ color: 'var(--primary-purple)' }}>{bestMonth ? formatMonth(bestMonth) : 'N/A'}</p>
              <p className="stat-card-subtitle">{bestMonth ? formatCurrency(bestMonthAmount) : 'No data yet'}</p>
            </div>
          </div>

          {/* Expenses by Category */}
          {Object.keys(expensesByCategory).length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <h2 className="section-title" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '16px' }}>Expenses by Category</h2>
              <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: 'clamp(16px, 3vw, 24px)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {Object.entries(expensesByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => {
                    const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                    return (
                      <div key={category} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>{category}</span>
                          <span style={{ color: 'var(--text-medium)', fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)', whiteSpace: 'nowrap' }}>{formatCurrency(amount)} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: 'var(--primary-purple)', transition: 'width 0.3s ease' }}></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Income by Category */}
          {Object.keys(incomesByCategory).length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <h2 className="section-title" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '16px' }}>Income by Category</h2>
              <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: 'clamp(16px, 3vw, 24px)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {Object.entries(incomesByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => {
                    const percentage = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
                    return (
                      <div key={category} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>{category}</span>
                          <span style={{ color: 'var(--text-medium)', fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)', whiteSpace: 'nowrap' }}>{formatCurrency(amount)} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: 'var(--primary-purple)', transition: 'width 0.3s ease' }}></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {expenses.length === 0 && incomes.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 'clamp(40px, 8vw, 60px)', color: 'var(--text-medium)', padding: '0 16px' }}>
              <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', marginBottom: '16px' }}>No data yet</p>
              <p style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Start adding expenses and income to see your statistics.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Stats;
