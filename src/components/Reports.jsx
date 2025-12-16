// src/components/Reports.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { FaArrowLeft, FaCalendar, FaChartLine, FaMoneyBillWave, FaPercent, FaArrowUp, FaArrowDown, FaExclamationTriangle } from 'react-icons/fa';
import '../styles/Reports.css';

const Reports = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [budget, setBudget] = useState(null);
  const [income, setIncome] = useState(null);

  const categories = {
    food: 'Food & Dining',
    transport: 'Transportation',
    shopping: 'Shopping',
    entertainment: 'Entertainment',
    bills: 'Bills & Utilities',
    health: 'Health & Medical',
    other: 'Other'
  };

  useEffect(() => {
    loadBudgetData();
    loadExpenses();
  }, []);

  useEffect(() => {
    // Filter expenses whenever timeRange or allExpenses changes
    setExpenses(filterByTimeRange(allExpenses));
  }, [timeRange, allExpenses]);

  const loadBudgetData = async () => {
    if (!auth.currentUser) return;

    try {
      const budgetRef = doc(db, 'budgets', auth.currentUser.uid);
      const budgetSnap = await getDoc(budgetRef);
      
      if (budgetSnap.exists()) {
        const data = budgetSnap.data();
        setBudget(data.amount || 0);
        setIncome(data.income || 0);
      } else {
        setBudget(0);
        setIncome(0);
      }
    } catch (error) {
      console.error('Error loading budget:', error);
      setBudget(0);
      setIncome(0);
    }
  };

  const loadExpenses = () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const expensesData = [];
        querySnapshot.forEach((doc) => {
          expensesData.push({
            id: doc.id,
            ...doc.data()
          });
        });

        setAllExpenses(expensesData);
        setLoading(false);
      }, (error) => {
        console.error('Error loading expenses:', error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up expenses listener:', error);
      setLoading(false);
    }
  };

  const filterByTimeRange = (data) => {
    const now = new Date();
    const filtered = data.filter(expense => {
      let expenseDate;
      
      // Handle Firestore timestamp
      if (expense.createdAt && typeof expense.createdAt === 'object' && 'seconds' in expense.createdAt) {
        expenseDate = new Date(expense.createdAt.seconds * 1000);
      } else if (expense.createdAt instanceof Date) {
        expenseDate = expense.createdAt;
      } else if (typeof expense.createdAt === 'string') {
        expenseDate = new Date(expense.createdAt);
      } else {
        return false;
      }
      
      switch (timeRange) {
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return expenseDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return expenseDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(now);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          return expenseDate >= yearAgo;
        case 'all':
          return true;
        default:
          return true;
      }
    });
    return filtered;
  };

  const getTotalSpent = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getCategoryBreakdown = () => {
    const breakdown = {};
    expenses.forEach(expense => {
      if (!breakdown[expense.category]) {
        breakdown[expense.category] = 0;
      }
      breakdown[expense.category] += expense.amount;
    });
    return breakdown;
  };

  const getAverageDailySpending = () => {
    if (expenses.length === 0) return 0;
    
    const total = getTotalSpent();
    let days = 1;
    
    if (timeRange === 'week') days = 7;
    else if (timeRange === 'month') days = 30;
    else if (timeRange === 'year') days = 365;
    
    return total / days;
  };

  const getTopCategory = () => {
    const breakdown = getCategoryBreakdown();
    let topCategory = '';
    let maxAmount = 0;
    
    Object.entries(breakdown).forEach(([category, amount]) => {
      if (amount > maxAmount) {
        maxAmount = amount;
        topCategory = category;
      }
    });
    
    return topCategory ? categories[topCategory] : 'N/A';
  };

  const getLargestExpense = () => {
    if (expenses.length === 0) return { description: 'N/A', amount: 0 };
    
    const largest = expenses.reduce((max, expense) => 
      expense.amount > max.amount ? expense : max
    , expenses[0]);
    
    return largest;
  };

  const getSmallestExpense = () => {
    if (expenses.length === 0) return { description: 'N/A', amount: 0 };
    
    const smallest = expenses.reduce((min, expense) => 
      expense.amount < min.amount ? expense : min
    , expenses[0]);
    
    return smallest;
  };

  const getBudgetComparison = () => {
    if (!budget || budget === 0) return null;
    
    const total = getTotalSpent();
    const remaining = budget - total;
    const percentUsed = (total / budget) * 100;
    
    return {
      remaining,
      percentUsed,
      status: percentUsed >= 100 ? 'exceeded' : percentUsed >= 80 ? 'warning' : 'good'
    };
  };

  const getSavingsAnalysis = () => {
    if (!income || income === 0) return null;
    
    const total = getTotalSpent();
    const savings = income - total;
    const savingsRate = (savings / income) * 100;
    
    return {
      savings,
      savingsRate,
      status: savingsRate >= 30 ? 'excellent' : savingsRate >= 20 ? 'good' : savingsRate >= 10 ? 'moderate' : 'poor'
    };
  };

  const getExpenseInsights = () => {
    const breakdown = getCategoryBreakdown();
    const total = getTotalSpent();
    const insights = [];
    
    // Find categories over 30% of spending
    Object.entries(breakdown).forEach(([category, amount]) => {
      const percent = (amount / total) * 100;
      if (percent > 30) {
        insights.push({
          type: 'warning',
          message: `${categories[category]} accounts for ${percent.toFixed(1)}% of your spending. Consider reviewing expenses in this category.`
        });
      }
    });
    
    // Check for frequent small purchases
    const smallExpenses = expenses.filter(e => e.amount < 10);
    if (smallExpenses.length > 10) {
      const smallTotal = smallExpenses.reduce((sum, e) => sum + e.amount, 0);
      insights.push({
        type: 'info',
        message: `You have ${smallExpenses.length} small purchases totaling $${smallTotal.toFixed(2)}. These add up quickly!`
      });
    }
    
    // Budget warning
    const budgetComp = getBudgetComparison();
    if (budgetComp && budgetComp.status === 'exceeded') {
      insights.push({
        type: 'alert',
        message: `You've exceeded your budget by $${Math.abs(budgetComp.remaining).toFixed(2)}. Consider reducing spending.`
      });
    }
    
    return insights;
  };

  const categoryBreakdown = getCategoryBreakdown();
  const budgetComparison = getBudgetComparison();
  const savingsAnalysis = getSavingsAnalysis();
  const largestExpense = getLargestExpense();
  const smallestExpense = getSmallestExpense();
  const insights = getExpenseInsights();

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  return (
    <div className="reports-page">
      <div className="reports-container">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>

        <h2 className="page-title">Expense Reports</h2>

        <div className="time-range-selector">
          <button 
            className={`range-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            Last 7 Days
          </button>
          <button 
            className={`range-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            Last 30 Days
          </button>
          <button 
            className={`range-btn ${timeRange === 'year' ? 'active' : ''}`}
            onClick={() => setTimeRange('year')}
          >
            Last Year
          </button>
          <button 
            className={`range-btn ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FaMoneyBillWave />
            </div>
            <div className="stat-content">
              <label>Total Spent</label>
              <p className="stat-value">${getTotalSpent().toFixed(2)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaCalendar />
            </div>
            <div className="stat-content">
              <label>Transactions</label>
              <p className="stat-value">{expenses.length}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaChartLine />
            </div>
            <div className="stat-content">
              <label>Avg Daily Spending</label>
              <p className="stat-value">${getAverageDailySpending().toFixed(2)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaChartLine />
            </div>
            <div className="stat-content">
              <label>Top Category</label>
              <p className="stat-value category-name">{getTopCategory()}</p>
            </div>
          </div>
        </div>

        {/* Budget Comparison Section */}
        {budgetComparison && (
          <div className="report-section budget-comparison">
            <h3>Budget Analysis</h3>
            <div className="budget-stats">
              <div className="budget-stat-item">
                <label>Budget Set</label>
                <p className="value">${budget.toFixed(2)}</p>
              </div>
              <div className="budget-stat-item">
                <label>Amount Spent</label>
                <p className="value">${getTotalSpent().toFixed(2)}</p>
              </div>
              <div className="budget-stat-item">
                <label>Remaining</label>
                <p className={`value ${budgetComparison.remaining < 0 ? 'negative' : 'positive'}`}>
                  ${Math.abs(budgetComparison.remaining).toFixed(2)}
                </p>
              </div>
              <div className="budget-stat-item">
                <label>Budget Used</label>
                <p className={`value ${budgetComparison.status === 'exceeded' ? 'negative' : ''}`}>
                  {budgetComparison.percentUsed.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="budget-progress-bar">
              <div 
                className={`budget-progress-fill ${budgetComparison.status}`}
                style={{ width: `${Math.min(budgetComparison.percentUsed, 100)}%` }}
              ></div>
            </div>
            {budgetComparison.status === 'exceeded' && (
              <div className="budget-alert exceeded">
                <FaExclamationTriangle /> Budget exceeded! You've overspent by ${Math.abs(budgetComparison.remaining).toFixed(2)}
              </div>
            )}
            {budgetComparison.status === 'warning' && (
              <div className="budget-alert warning">
                <FaExclamationTriangle /> Warning: You're approaching your budget limit
              </div>
            )}
          </div>
        )}

        {/* Savings Analysis */}
        {savingsAnalysis && (
          <div className="report-section savings-analysis">
            <h3>Savings Analysis</h3>
            <div className="savings-stats">
              <div className="savings-stat-item">
                <label>Monthly Income</label>
                <p className="value">${income.toFixed(2)}</p>
              </div>
              <div className="savings-stat-item">
                <label>Total Expenses</label>
                <p className="value">${getTotalSpent().toFixed(2)}</p>
              </div>
              <div className="savings-stat-item">
                <label>Net Savings</label>
                <p className={`value ${savingsAnalysis.savings < 0 ? 'negative' : 'positive'}`}>
                  {savingsAnalysis.savings >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                  ${Math.abs(savingsAnalysis.savings).toFixed(2)}
                </p>
              </div>
              <div className="savings-stat-item">
                <label>Savings Rate</label>
                <p className={`value savings-rate-${savingsAnalysis.status}`}>
                  <FaPercent /> {savingsAnalysis.savingsRate.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="savings-recommendation">
              {savingsAnalysis.status === 'excellent' && (
                <p className="rec excellent">🎉 Excellent! You're saving over 30% of your income. Keep up the great work!</p>
              )}
              {savingsAnalysis.status === 'good' && (
                <p className="rec good">👍 Great job! You're maintaining a healthy savings rate of 20-30%.</p>
              )}
              {savingsAnalysis.status === 'moderate' && (
                <p className="rec moderate">💡 Your savings rate is moderate. Try to aim for at least 20% savings.</p>
              )}
              {savingsAnalysis.status === 'poor' && (
                <p className="rec poor">⚠️ Your savings rate is low. Review your expenses and try to cut back where possible.</p>
              )}
            </div>
          </div>
        )}

        {/* Expense Insights */}
        {insights.length > 0 && (
          <div className="report-section insights-section">
            <h3>💡 Insights & Recommendations</h3>
            <div className="insights-list">
              {insights.map((insight, index) => (
                <div key={index} className={`insight-item ${insight.type}`}>
                  {insight.type === 'alert' && <FaExclamationTriangle />}
                  {insight.type === 'warning' && <FaExclamationTriangle />}
                  <p>{insight.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expense Extremes */}
        {expenses.length > 0 && (
          <div className="report-section expense-extremes">
            <h3>Expense Details</h3>
            <div className="extremes-grid">
              <div className="extreme-card largest">
                <label>Largest Expense</label>
                <p className="expense-desc">{largestExpense.description}</p>
                <p className="expense-amount">${largestExpense.amount.toFixed(2)}</p>
                <span className="expense-category">{categories[largestExpense.category]}</span>
              </div>
              <div className="extreme-card smallest">
                <label>Smallest Expense</label>
                <p className="expense-desc">{smallestExpense.description}</p>
                <p className="expense-amount">${smallestExpense.amount.toFixed(2)}</p>
                <span className="expense-category">{categories[smallestExpense.category]}</span>
              </div>
            </div>
          </div>
        )}

        <div className="category-breakdown">
          <h3>Spending by Category</h3>
          {Object.keys(categoryBreakdown).length === 0 ? (
            <p className="no-data">No expenses in this time range</p>
          ) : (
            <div className="breakdown-list">
              {Object.entries(categoryBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const percentage = (amount / getTotalSpent()) * 100;
                  return (
                    <div key={category} className="breakdown-item">
                      <div className="breakdown-header">
                        <span className="category-label">{categories[category]}</span>
                        <span className="category-amount">${amount.toFixed(2)}</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="percentage">{percentage.toFixed(1)}%</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
