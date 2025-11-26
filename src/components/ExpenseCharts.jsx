// src/components/ExpenseCharts.jsx
import { useState, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { FaChartPie, FaChartBar, FaChartLine, FaCalendarAlt } from 'react-icons/fa';
import '../styles/ExpenseCharts.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

const ExpenseCharts = ({ expenses }) => {
  const [activeChart, setActiveChart] = useState('pie');
  const [timeFilter, setTimeFilter] = useState('thisMonth');

  const categories = {
    food: { label: 'Food & Dining', color: '#FF6384', icon: '🍕' },
    transport: { label: 'Transportation', color: '#36A2EB', icon: '🚗' },
    shopping: { label: 'Shopping', color: '#FFCE56', icon: '🛍️' },
    entertainment: { label: 'Entertainment', color: '#4BC0C0', icon: '🎬' },
    bills: { label: 'Bills & Utilities', color: '#9966FF', icon: '💡' },
    health: { label: 'Health & Medical', color: '#FF9F40', icon: '🏥' },
    other: { label: 'Other', color: '#FF6B6B', icon: '📝' }
  };

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses.filter(expense => {
      const expenseDate = expense.createdAt?.seconds 
        ? new Date(expense.createdAt.seconds * 1000)
        : new Date(expense.createdAt);

      switch (timeFilter) {
        case 'thisMonth':
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        case 'lastMonth': {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear;
        }
        case 'last3Months': {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          return expenseDate >= threeMonthsAgo;
        }
        case 'thisYear':
          return expenseDate.getFullYear() === currentYear;
        default:
          return true;
      }
    });
  }, [expenses, timeFilter]);

  const categoryData = useMemo(() => {
    const categoryTotals = {};
    
    filteredExpenses.forEach(expense => {
      const category = expense.category || 'other';
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });

    return categoryTotals;
  }, [filteredExpenses]);

  const pieChartData = {
    labels: Object.keys(categoryData).map(key => categories[key]?.label || key),
    datasets: [
      {
        data: Object.values(categoryData),
        backgroundColor: Object.keys(categoryData).map(key => categories[key]?.color || '#999'),
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const barChartData = {
    labels: Object.keys(categoryData).map(key => categories[key]?.label || key),
    datasets: [
      {
        label: 'Amount Spent ($)',
        data: Object.values(categoryData),
        backgroundColor: Object.keys(categoryData).map(key => categories[key]?.color || '#999'),
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const dailySpending = useMemo(() => {
    const dailyTotals = {};
    
    filteredExpenses.forEach(expense => {
      const date = expense.createdAt?.seconds 
        ? new Date(expense.createdAt.seconds * 1000)
        : new Date(expense.createdAt);
      const dateStr = date.toISOString().split('T')[0];
      dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + expense.amount;
    });

    const sortedDates = Object.keys(dailyTotals).sort();
    return {
      labels: sortedDates.map(date => new Date(date).toLocaleDateString()),
      data: sortedDates.map(date => dailyTotals[date])
    };
  }, [filteredExpenses]);

  const lineChartData = {
    labels: dailySpending.labels,
    datasets: [
      {
        label: 'Daily Spending',
        data: dailySpending.data,
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#36A2EB',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#36A2EB',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed || context.raw;
            return `${context.label}: $${value.toFixed(2)}`;
          }
        }
      }
    }
  };

  const totalSpent = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const avgDaily = dailySpending.data.length > 0 
    ? totalSpent / dailySpending.data.length 
    : 0;

  const chartComponents = {
    pie: <Pie data={pieChartData} options={chartOptions} />,
    bar: <Bar data={barChartData} options={chartOptions} />,
    line: <Line data={lineChartData} options={chartOptions} />
  };

  return (
    <div className="expense-charts-container">
      <div className="charts-header">
        <div className="charts-title">
          <h3>📊 Expense Analytics</h3>
          <div className="time-filter">
            <FaCalendarAlt className="calendar-icon" />
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="last3Months">Last 3 Months</option>
              <option value="thisYear">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        <div className="chart-controls">
          <button
            className={`chart-btn ${activeChart === 'pie' ? 'active' : ''}`}
            onClick={() => setActiveChart('pie')}
          >
            <FaChartPie /> Pie
          </button>
          <button
            className={`chart-btn ${activeChart === 'bar' ? 'active' : ''}`}
            onClick={() => setActiveChart('bar')}
          >
            <FaChartBar /> Bar
          </button>
          <button
            className={`chart-btn ${activeChart === 'line' ? 'active' : ''}`}
            onClick={() => setActiveChart('line')}
          >
            <FaChartLine /> Trend
          </button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h4>Total Spent</h4>
            <p>${totalSpent.toFixed(2)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <h4>Daily Average</h4>
            <p>${avgDaily.toFixed(2)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h4>Transactions</h4>
            <p>{filteredExpenses.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-info">
            <h4>Top Category</h4>
            <p>
              {Object.keys(categoryData).length > 0
                ? categories[
                    Object.entries(categoryData).reduce((a, b) => categoryData[a[0]] > categoryData[b[0]] ? a : b)[0]
                  ]?.label || 'None'
                : 'None'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-wrapper">
          {filteredExpenses.length > 0 ? (
            chartComponents[activeChart]
          ) : (
            <div className="no-data">
              <div className="no-data-icon">📊</div>
              <h4>No data available</h4>
              <p>Add some expenses to see your spending patterns!</p>
            </div>
          )}
        </div>
      </div>

      {Object.keys(categoryData).length > 0 && (
        <div className="category-breakdown">
          <h4>Category Breakdown</h4>
          <div className="category-list">
            {Object.entries(categoryData)
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount]) => {
                const percentage = ((amount / totalSpent) * 100).toFixed(1);
                return (
                  <div key={category} className="category-item">
                    <div className="category-info">
                      <span className="category-icon">
                        {categories[category]?.icon || '📝'}
                      </span>
                      <span className="category-name">
                        {categories[category]?.label || category}
                      </span>
                    </div>
                    <div className="category-stats">
                      <span className="category-amount">${amount.toFixed(2)}</span>
                      <span className="category-percentage">{percentage}%</span>
                    </div>
                    <div 
                      className="category-bar"
                      style={{
                        background: `linear-gradient(90deg, ${categories[category]?.color || '#999'} ${percentage}%, #f0f0f0 ${percentage}%)`
                      }}
                    ></div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseCharts;