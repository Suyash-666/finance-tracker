// src/components/Reports.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { FaArrowLeft, FaCalendar, FaChartLine, FaMoneyBillWave } from 'react-icons/fa';
import '../styles/Reports.css';

const Reports = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');

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
    loadExpenses();
  }, [timeRange]);

  const loadExpenses = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const expensesData = [];
      querySnapshot.forEach((doc) => {
        expensesData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setExpenses(filterByTimeRange(expensesData));
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
    setLoading(false);
  };

  const filterByTimeRange = (data) => {
    const now = new Date();
    const filtered = data.filter(expense => {
      const expenseDate = new Date(expense.createdAt.seconds * 1000);
      
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

  const categoryBreakdown = getCategoryBreakdown();

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
