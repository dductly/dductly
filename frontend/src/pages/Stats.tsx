import React, { useState, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

type TimeRange = '1M' | '3M' | 'YTD' | '1Y' | 'ALL';

interface StatsProps {
  onNavigate: (page: string) => void;
}

const getStartDate = (range: TimeRange): Date | null => {
  const now = new Date();
  switch (range) {
    case '1M': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    case '3M': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return d;
    }
    case 'YTD': {
      return new Date(now.getFullYear(), 0, 1);
    }
    case '1Y': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    case 'ALL':
    default:
      return null;
  }
};

const Stats: React.FC<StatsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { expenses } = useExpenses();
  const { incomes } = useIncome();
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');

  const businessName = user?.user_metadata?.business_name
    ? (user.user_metadata.business_name.endsWith('s')
      ? user.user_metadata.business_name
      : `${user.user_metadata.business_name}'s`)
    : "Your Business";

  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const filteredExpenses = useMemo(() => {
    const start = getStartDate(timeRange);
    if (!start) return expenses;
    start.setHours(0, 0, 0, 0);
    return expenses.filter(e => parseLocalDate(e.expense_date) >= start);
  }, [expenses, timeRange]);

  const filteredIncomes = useMemo(() => {
    const start = getStartDate(timeRange);
    if (!start) return incomes;
    start.setHours(0, 0, 0, 0);
    return incomes.filter(i => parseLocalDate(i.income_date) >= start);
  }, [incomes, timeRange]);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalIncome = filteredIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  // Previous period comparison
  const prevPeriod = useMemo(() => {
    if (timeRange === 'ALL') return null;
    const currentStart = getStartDate(timeRange);
    if (!currentStart) return null;
    currentStart.setHours(0, 0, 0, 0);

    const now = new Date();
    const periodMs = now.getTime() - currentStart.getTime();
    const prevStart = new Date(currentStart.getTime() - periodMs);
    const prevEnd = currentStart;

    const prevIncome = incomes
      .filter(i => { const d = parseLocalDate(i.income_date); return d >= prevStart && d < prevEnd; })
      .reduce((sum, i) => sum + i.amount, 0);
    const prevExpense = expenses
      .filter(e => { const d = parseLocalDate(e.expense_date); return d >= prevStart && d < prevEnd; })
      .reduce((sum, e) => sum + e.amount, 0);

    return { income: prevIncome, expenses: prevExpense, profit: prevIncome - prevExpense };
  }, [expenses, incomes, timeRange]);

  const getChangeIndicator = (current: number, previous: number | null) => {
    if (previous === null || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return { change, direction: change >= 0 ? 'up' as const : 'down' as const };
  };

  const expensesByCategory: Record<string, number> = {};
  filteredExpenses.forEach(expense => {
    if (expensesByCategory[expense.category]) {
      expensesByCategory[expense.category] += expense.amount;
    } else {
      expensesByCategory[expense.category] = expense.amount;
    }
  });

  const incomesByCategory: Record<string, number> = {};
  filteredIncomes.forEach(inc => {
    if (incomesByCategory[inc.category]) {
      incomesByCategory[inc.category] += inc.amount;
    } else {
      incomesByCategory[inc.category] = inc.amount;
    }
  });

  const incomeByMonth: Record<string, number> = {};
  filteredIncomes.forEach(inc => {
    const date = parseLocalDate(inc.income_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (incomeByMonth[monthKey]) {
      incomeByMonth[monthKey] += inc.amount;
    } else {
      incomeByMonth[monthKey] = inc.amount;
    }
  });

  let bestMonth = '';
  let bestMonthAmount = 0;
  Object.entries(incomeByMonth).forEach(([month, amount]) => {
    if (amount > bestMonthAmount) {
      bestMonthAmount = amount;
      bestMonth = month;
    }
  });

  const monthlyChartData = useMemo(() => {
    const monthMap: Record<string, { income: number; expenses: number }> = {};

    filteredIncomes.forEach(inc => {
      const date = parseLocalDate(inc.income_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { income: 0, expenses: 0 };
      monthMap[key].income += inc.amount;
    });

    filteredExpenses.forEach(exp => {
      const date = parseLocalDate(exp.expense_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { income: 0, expenses: 0 };
      monthMap[key].expenses += exp.amount;
    });

    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => {
        const [y, m] = key.split('-');
        const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return { month: label, Income: val.income, Expenses: val.expenses };
      });
  }, [filteredExpenses, filteredIncomes]);

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

  const timeRanges: TimeRange[] = ['1M', '3M', 'YTD', '1Y', 'ALL'];
  const rangeLabels: Record<TimeRange, string> = {
    '1M': '1M',
    '3M': '3M',
    'YTD': 'YTD',
    '1Y': '1Y',
    'ALL': 'All',
  };

  const [showMore, setShowMore] = useState(false);
  const [revenueGoal, setRevenueGoal] = useState<number>(() => {
    const saved = localStorage.getItem('dductly_revenue_goal');
    return saved ? parseFloat(saved) : 0;
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  const profitMarginLabel = profitMargin >= 60 ? 'Excellent' : profitMargin >= 40 ? 'Strong' : profitMargin >= 20 ? 'Healthy' : profitMargin >= 0 ? 'Needs attention' : 'Negative margin';

  const goalProgressRaw = revenueGoal > 0 ? (totalIncome / revenueGoal) * 100 : 0;
  const goalProgress = Math.min(goalProgressRaw, 100);
  const goalExceeded = goalProgressRaw > 100;

  const incomeByItem: Record<string, number> = {};
  filteredIncomes.forEach(inc => {
    const key = inc.description || inc.category || 'Uncategorized';
    incomeByItem[key] = (incomeByItem[key] || 0) + inc.amount;
  });
  const topItemEntry = Object.entries(incomeByItem).sort(([, a], [, b]) => b - a)[0];
  const topItem = topItemEntry ? topItemEntry[0] : null;
  const topItemAmount = topItemEntry ? topItemEntry[1] : 0;

  const taxRate = 0.25;
  const taxSetAside = netProfit > 0 ? netProfit * taxRate : 0;

  const handleSaveGoal = () => {
    const val = parseFloat(goalInput.replace(/,/g, ''));
    if (!isNaN(val) && val > 0) {
      setRevenueGoal(val);
      localStorage.setItem('dductly_revenue_goal', val.toString());
    }
    setEditingGoal(false);
    setGoalInput('');
  };

  const hasData = expenses.length > 0 || incomes.length > 0;
  const hasFilteredData = filteredExpenses.length > 0 || filteredIncomes.length > 0;

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

          {hasData && (
            <div className="stats-time-filters">
              {timeRanges.map(range => (
                <button
                  key={range}
                  className={`stats-time-btn ${timeRange === range ? 'stats-time-btn-active' : ''}`}
                  onClick={() => setTimeRange(range)}
                >
                  {rangeLabels[range]}
                </button>
              ))}
            </div>
          )}

          {hasFilteredData && (
            <>
              <div className="stats-page-grid">
                <div className="stat-card-uniform">
                  <h3 className="stat-card-label">Revenue</h3>
                  <p className="stat-card-value" style={{ color: 'var(--primary-purple)' }}>{formatCurrency(totalIncome)}</p>
                  <p className="stat-card-subtitle">
                    {filteredIncomes.length} entries
                    {(() => {
                      const ind = getChangeIndicator(totalIncome, prevPeriod?.income ?? null);
                      if (!ind) return null;
                      return <span className={`change-indicator ${ind.direction === 'up' ? 'change-up' : 'change-down'}`}>{ind.direction === 'up' ? '↑' : '↓'} {Math.abs(ind.change).toFixed(0)}% vs last period</span>;
                    })()}
                  </p>
                </div>

                <div className="stat-card-uniform">
                  <h3 className="stat-card-label">Net Profit</h3>
                  <p className="stat-card-value" style={{ color: netProfit >= 0 ? '#66BB6A' : '#EF9A9A' }}>{formatCurrency(netProfit)}</p>
                  <p className="stat-card-subtitle">
                    {netProfit >= 0 ? 'Profitable' : 'Loss'}
                    {(() => {
                      const ind = getChangeIndicator(netProfit, prevPeriod?.profit ?? null);
                      if (!ind) return null;
                      return <span className={`change-indicator ${ind.direction === 'up' ? 'change-up' : 'change-down'}`}>{ind.direction === 'up' ? '↑' : '↓'} {Math.abs(ind.change).toFixed(0)}% vs last period</span>;
                    })()}
                  </p>
                </div>

                <div className="stat-card-uniform">
                  <h3 className="stat-card-label">Total Expenses</h3>
                  <p className="stat-card-value" style={{ color: '#EF9A9A' }}>{formatCurrency(totalExpenses)}</p>
                  <p className="stat-card-subtitle">
                    {filteredExpenses.length} entries
                    {(() => {
                      const ind = getChangeIndicator(totalExpenses, prevPeriod?.expenses ?? null);
                      if (!ind) return null;
                      return <span className={`change-indicator ${ind.direction === 'up' ? 'change-up' : 'change-down'}`}>{ind.direction === 'up' ? '↑' : '↓'} {Math.abs(ind.change).toFixed(0)}% vs last period</span>;
                    })()}
                  </p>
                </div>

                <div className="stat-card-uniform">
                  <h3 className="stat-card-label">Best Month</h3>
                  <p className="stat-card-value" style={{ color: 'var(--primary-purple)' }}>{bestMonth ? formatMonth(bestMonth) : 'N/A'}</p>
                  <p className="stat-card-subtitle">{bestMonth ? formatCurrency(bestMonthAmount) : 'No data yet'}</p>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  className="stats-view-more-btn"
                  onClick={() => setShowMore(!showMore)}
                >
                  {showMore ? 'View Less' : 'View More'}
                </button>
              </div>

              {showMore && (
                <div className="stats-page-grid" style={{ marginTop: '16px' }}>
                  <div className="stat-card-uniform">
                    <h3 className="stat-card-label">Profit Margin</h3>
                    <p className="stat-card-value" style={{ color: profitMargin >= 40 ? '#66BB6A' : profitMargin >= 20 ? 'var(--primary-purple)' : profitMargin >= 0 ? '#FFA726' : '#EF9A9A' }}>{profitMargin.toFixed(1)}%</p>
                    <p className="stat-card-subtitle">{totalIncome > 0 ? profitMarginLabel : 'No income yet'}</p>
                    <p className="stat-card-subtitle">How much of your income you keep after expenses</p>
                  </div>

                  <div className="stat-card-uniform">
                    <h3 className="stat-card-label">Revenue Goal</h3>
                    {editingGoal ? (
                      <div className="goal-edit-inline">
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-medium)', fontSize: '0.875rem' }}>$</span>
                          <input
                            type="text"
                            className="goal-input"
                            placeholder="e.g. 20,000"
                            value={goalInput}
                            onChange={(e) => setGoalInput(e.target.value.replace(/[^0-9.,]/g, ''))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveGoal(); if (e.key === 'Escape') { setEditingGoal(false); setGoalInput(''); } }}
                            autoFocus
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button className="goal-save-btn" onClick={handleSaveGoal}>Save</button>
                          <button className="goal-cancel-btn" onClick={() => { setEditingGoal(false); setGoalInput(''); }}>Cancel</button>
                        </div>
                      </div>
                    ) : revenueGoal > 0 ? (
                      <>
                        <p className="stat-card-value" style={{ color: goalExceeded ? '#66BB6A' : 'var(--primary-purple)', fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
                          {goalExceeded ? `${goalProgressRaw.toFixed(0)}% of goal` : `${formatCurrency(totalIncome)} of ${formatCurrency(revenueGoal)}`}
                        </p>
                        <div className="goal-progress-bar">
                          <div className="goal-progress-fill" style={{ width: `${goalProgress}%`, background: goalExceeded ? '#66BB6A' : undefined }}></div>
                        </div>
                        <p className="stat-card-subtitle">{goalExceeded ? 'Goal reached! Consider raising your target.' : `${goalProgress.toFixed(0)}% complete`}</p>
                        <button className="goal-edit-btn" onClick={() => { setEditingGoal(true); setGoalInput(revenueGoal.toString()); }}>{goalExceeded ? 'Raise Goal' : 'Edit Goal'}</button>
                      </>
                    ) : (
                      <>
                        <p className="stat-card-value" style={{ color: 'var(--text-medium)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>No goal set</p>
                        <button className="goal-edit-btn" onClick={() => setEditingGoal(true)} style={{ marginTop: '8px' }}>Set a Goal</button>
                      </>
                    )}
                  </div>

                  <div className="stat-card-uniform">
                    <h3 className="stat-card-label">Top Earner</h3>
                    <p className="stat-card-value" style={{ color: 'var(--primary-purple)', fontSize: topItem && topItem.length > 15 ? 'clamp(0.875rem, 2.5vw, 1.1rem)' : 'clamp(1rem, 3vw, 1.25rem)' }}>{topItem || 'N/A'}</p>
                    <p className="stat-card-subtitle">{topItem ? `${formatCurrency(topItemAmount)} (${totalIncome > 0 ? ((topItemAmount / totalIncome) * 100).toFixed(0) : 0}% of revenue)` : 'No income data'}</p>
                  </div>

                  <div className="stat-card-uniform">
                    <h3 className="stat-card-label">Tax Set-Aside</h3>
                    <p className="stat-card-value" style={{ color: taxSetAside > 0 ? '#FFA726' : 'var(--text-medium)' }}>{taxSetAside > 0 ? formatCurrency(taxSetAside) : '$0.00'}</p>
                    <p className="stat-card-subtitle">{taxSetAside > 0 ? 'Based on estimated 25% self-employment tax' : 'No profit to set aside'}</p>
                  </div>
                </div>
              )}

              {monthlyChartData.length > 1 && (
                <div style={{ marginTop: '32px' }}>
                  <h2 className="section-title" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '16px' }}>Income vs Expenses Over Time</h2>
                  <div className="stats-chart-card">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-secondary)" />
                        <XAxis dataKey="month" tick={{ fontSize: 13, fill: 'var(--text-primary)' }} />
                        <YAxis tick={{ fontSize: 13, fill: 'var(--text-primary)' }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                        <Tooltip
                          formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                          contentStyle={{ backgroundColor: isDarkMode ? '#1a202c' : '#ffffff', border: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0', borderRadius: '8px', color: isDarkMode ? '#e2e8f0' : '#2D3748', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}
                          labelStyle={{ color: isDarkMode ? '#e2e8f0' : '#2D3748', fontWeight: 700 }}
                          itemStyle={{ color: isDarkMode ? '#e2e8f0' : '#2D3748' }}
                          isAnimationActive={false}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="Income" stroke="var(--primary-purple)" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Expenses" stroke="#EF9A9A" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {monthlyChartData.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                  <h2 className="section-title" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '16px' }}>Monthly Comparison</h2>
                  <div className="stats-chart-card">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-secondary)" />
                        <XAxis dataKey="month" tick={{ fontSize: 13, fill: 'var(--text-primary)' }} />
                        <YAxis tick={{ fontSize: 13, fill: 'var(--text-primary)' }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                        <Tooltip
                          formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                          contentStyle={{ backgroundColor: isDarkMode ? '#1a202c' : '#ffffff', border: isDarkMode ? '1px solid #4a5568' : '1px solid #e2e8f0', borderRadius: '8px', color: isDarkMode ? '#e2e8f0' : '#2D3748', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}
                          labelStyle={{ color: isDarkMode ? '#e2e8f0' : '#2D3748', fontWeight: 700 }}
                          itemStyle={{ color: isDarkMode ? '#e2e8f0' : '#2D3748' }}
                          isAnimationActive={false}
                        />
                        <Legend />
                        <Bar dataKey="Income" fill="var(--primary-purple)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Expenses" fill="#EF9A9A" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {monthlyChartData.length <= 1 && monthlyChartData.length > 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-medium)', fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)', marginTop: '12px' }}>
                  Add data across more months to see trend lines
                </p>
              )}

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
            </>
          )}

          {!hasFilteredData && hasData && (
            <div style={{ textAlign: 'center', marginTop: 'clamp(40px, 8vw, 60px)', color: 'var(--text-medium)', padding: '0 16px' }}>
              <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', marginBottom: '16px' }}>No data found for the selected time period.</p>
              <button className="stats-time-btn stats-time-btn-active" onClick={() => setTimeRange('ALL')}>
                View All Data
              </button>
            </div>
          )}

          {!hasData && (
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
