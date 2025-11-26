// src/components/Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { toast } from 'react-toastify';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import ExpenseCharts from './ExpenseCharts';
import { FaChartLine, FaUser, FaSignOutAlt, FaPlus, FaList, FaChartPie, FaBars, FaTimes, FaFileAlt, FaQuestionCircle, FaCommentDots, FaLightbulb, FaCreditCard, FaRedoAlt, FaWallet } from 'react-icons/fa';
import '../styles/Dashboard.css';
import '../styles/NewTabs.css';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Budget state with loading indicator
  const [budget, setBudget] = useState(null);
  const [income, setIncome] = useState(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [incomeInput, setIncomeInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const expensesData = [];
      querySnapshot.forEach((doc) => {
        expensesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setExpenses(expensesData);
    });

    // Load saved budget and income from Firestore
    const loadBudgetData = async () => {
      try {
        const budgetRef = doc(db, 'budgets', auth.currentUser.uid);
        const budgetSnap = await getDoc(budgetRef);
        
        if (budgetSnap.exists()) {
          const data = budgetSnap.data();
          const budgetAmount = data.amount || 0;
          const incomeAmount = data.income || 0;
          
          setBudget(budgetAmount);
          setIncome(incomeAmount);
          setBudgetInput(budgetAmount.toString());
          setIncomeInput(incomeAmount.toString());
        } else {
          setBudget(0);
          setIncome(0);
        }
      } catch (error) {
        console.error('Error loading budget:', error);
        setBudget(0);
        setIncome(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBudgetData();

    return () => unsubscribe();
  }, [refreshTrigger]);

  // Memoized total spending calculation
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  }, [expenses]);

  // Calculate budget metrics
  const budgetMetrics = useMemo(() => {
    if (budget === null || budget === 0) {
      return { percent: 0, remaining: 0, savings: 0, savingsPercent: 0 };
    }

    const percent = (totalSpent / budget) * 100;
    const remaining = budget - totalSpent;
    const savings = income > 0 ? income - totalSpent : remaining;
    const savingsPercent = income > 0 ? (savings / income) * 100 : 0;

    return { percent, remaining, savings, savingsPercent };
  }, [totalSpent, budget, income]);

  // Budget alert with proper levels
  const budgetAlert = useMemo(() => {
    if (budget === null || budget === 0) return null;

    const { percent } = budgetMetrics;

    if (percent >= 100) {
      return {
        level: 'critical',
        message: `Budget exceeded by $${Math.abs(budgetMetrics.remaining).toFixed(2)}!`,
        className: 'alert-critical'
      };
    } else if (percent >= 80) {
      return {
        level: 'warning',
        message: `Warning: ${percent.toFixed(1)}% of budget used ($${budgetMetrics.remaining.toFixed(2)} remaining)`,
        className: 'alert-warning'
      };
    } else if (percent >= 50) {
      return {
        level: 'info',
        message: `${percent.toFixed(1)}% of budget used ($${budgetMetrics.remaining.toFixed(2)} remaining)`,
        className: 'alert-info'
      };
    } else {
      return {
        level: 'good',
        message: `On track: ${percent.toFixed(1)}% used, $${budgetMetrics.remaining.toFixed(2)} remaining`,
        className: 'alert-good'
      };
    }
  }, [budget, budgetMetrics]);

  // Investment tips with better logic
  const investmentTip = useMemo(() => {
    if (income === null || income === 0) {
      return {
        title: 'Set Your Income',
        message: 'Add your monthly income to get personalized investment tips.',
        type: 'info'
      };
    }

    const { savings, savingsPercent } = budgetMetrics;

    if (savings <= 0) {
      return {
        title: 'Focus on Reducing Expenses',
        message: 'Your expenses meet or exceed your income. Review your spending and identify areas to cut back.',
        type: 'warning'
      };
    }

    if (savingsPercent >= 30) {
      return {
        title: 'Excellent Savings Rate!',
        message: `You're saving ${savingsPercent.toFixed(1)}% ($${savings.toFixed(2)}). Consider diversifying into index funds, ETFs, or a retirement account for long-term growth.`,
        type: 'excellent'
      };
    } else if (savingsPercent >= 20) {
      return {
        title: 'Great Savings Habit',
        message: `You're saving ${savingsPercent.toFixed(1)}% ($${savings.toFixed(2)}). Consider opening a high-yield savings account or exploring low-risk mutual funds.`,
        type: 'good'
      };
    } else if (savingsPercent >= 10) {
      return {
        title: 'Building Your Savings',
        message: `You're saving ${savingsPercent.toFixed(1)}% ($${savings.toFixed(2)}). Try to increase this to 20% by reducing discretionary spending. Consider starting an emergency fund.`,
        type: 'moderate'
      };
    } else {
      return {
        title: 'Increase Your Savings',
        message: `You're saving only ${savingsPercent.toFixed(1)}% ($${savings.toFixed(2)}). Aim for at least 20% savings. Review your expenses and create a budget to save more.`,
        type: 'alert'
      };
    }
  }, [income, budgetMetrics]);

  // Save budget with validation and error handling
  const handleBudgetSave = async () => {
    setSaveError('');
    
    const budgetValue = parseFloat(budgetInput);
    const incomeValue = parseFloat(incomeInput);

    // Validation
    if (isNaN(budgetValue) || budgetValue < 0) {
      toast.error('Please enter a valid budget amount');
      setSaveError('Please enter a valid budget amount');
      return;
    }

    if (isNaN(incomeValue) || incomeValue < 0) {
      toast.error('Please enter a valid income amount');
      setSaveError('Please enter a valid income amount');
      return;
    }

    if (budgetValue > incomeValue && incomeValue > 0) {
      const confirm = window.confirm(
        'Your budget exceeds your income. Are you sure you want to continue?'
      );
      if (!confirm) return;
    }

    try {
      await setDoc(doc(db, 'budgets', auth.currentUser.uid), {
        amount: budgetValue,
        income: incomeValue,
        updatedAt: new Date().toISOString()
      });
      
      setBudget(budgetValue);
      setIncome(incomeValue);
      toast.success('Budget and income saved successfully!');
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Failed to save budget. Please try again.');
      setSaveError('Failed to save budget. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully!');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const getUserDisplayName = () => {
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserAvatar = () => {
    if (user.photoURL) return user.photoURL;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserDisplayName())}&background=4f46e5&color=fff&size=40`;
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Menu</h3>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
            <FaTimes />
          </button>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => { setActiveTab('budget'); setSidebarOpen(false); }} className="sidebar-link">
            <FaChartLine /> Budget
          </button>
          <button onClick={() => { setActiveTab('reports'); setSidebarOpen(false); }} className="sidebar-link">
            <FaChartPie /> Charts
          </button>
          <button onClick={() => navigate('/reports')} className="sidebar-link">
            <FaFileAlt /> Reports
          </button>
          <button onClick={() => navigate('/debt-tracker')} className="sidebar-link">
            <FaCreditCard /> Debt Tracker
          </button>
          <button onClick={() => navigate('/recurring-expenses')} className="sidebar-link">
            <FaRedoAlt /> Recurring Expenses
          </button>
          <button onClick={() => navigate('/income-sources')} className="sidebar-link">
            <FaWallet /> Income Sources
          </button>
          <button onClick={() => navigate('/investment-tips')} className="sidebar-link">
            <FaLightbulb /> Investment Tips
          </button>
          <button onClick={() => navigate('/help')} className="sidebar-link">
            <FaQuestionCircle /> Help
          </button>
          <button onClick={() => navigate('/feedback')} className="sidebar-link">
            <FaCommentDots /> Feedback
          </button>
          <button onClick={() => navigate('/user-info')} className="sidebar-link">
            <FaUser /> User Info
          </button>
        </nav>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <header className="dashboard-header">
        <div className="header-left">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <FaBars />
          </button>
          <div className="logo">
            <FaChartLine className="logo-icon" />
            <h1>FinanceTracker</h1>
          </div>
        </div>

        <nav className="dashboard-nav">
          <button
            className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FaChartPie /> Overview
          </button>
          <button
            className={`nav-btn ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <FaPlus /> Add Expense
          </button>
          <button
            className={`nav-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <FaList /> Expense List
          </button>
        </nav>

        <div className="user-info">
          <div className="user-avatar">
            <img src={getUserAvatar()} alt="User Avatar" />
          </div>
          <div className="user-details">
            <span className="user-name">{getUserDisplayName()}</span>
            <span className="user-email">{user.email}</span>
          </div>
          <button onClick={handleSignOut} className="sign-out-button">
            <FaSignOutAlt />
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Overview tab content */}
        {activeTab === 'overview' && (
          <>
            {budgetAlert && (
              <div className={`budget-alert ${budgetAlert.className}`}>
                <strong>{budgetAlert.level.toUpperCase()}:</strong> {budgetAlert.message}
              </div>
            )}

            {/* Budget Summary - Read Only */}
            {budget !== null && budget > 0 ? (
              <div className="overview-summary">
                <h3>📊 Budget Overview</h3>
                <div className="budget-summary">
                  <div className="summary-item">
                    <span className="label">Total Spent</span>
                    <span className="value">${totalSpent.toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Monthly Budget</span>
                    <span className="value">${budget.toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Remaining</span>
                    <span className={`value ${budgetMetrics.remaining < 0 ? 'negative' : 'positive'}`}>
                      ${Math.abs(budgetMetrics.remaining).toFixed(2)}
                    </span>
                  </div>
                  {income > 0 && (
                    <>
                      <div className="summary-item">
                        <span className="label">Monthly Income</span>
                        <span className="value">${income.toFixed(2)}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Savings</span>
                        <span className="value">${budgetMetrics.savings.toFixed(2)}</span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Savings Rate</span>
                        <span className="value">{budgetMetrics.savingsPercent.toFixed(1)}%</span>
                      </div>
                    </>  
                  )}
                </div>
                <div className="budget-controls">
                  <button onClick={() => setActiveTab('budget')}>
                    ⚙️ Configure Budget & Income
                  </button>
                </div>
              </div>
            ) : (
              <div className="overview-summary">
                <h3>⚠️ Budget Not Set</h3>
                <p>Set your monthly budget and income to start tracking your finances effectively.</p>
                <div className="budget-controls">
                  <button onClick={() => setActiveTab('budget')}>
                    ⚙️ Set Budget & Income
                  </button>
                </div>
              </div>
            )}

            {/* Investment Tips */}
            <div className={`investment-tips ${investmentTip.type}`}>
              <h4>{investmentTip.title}</h4>
              <p>{investmentTip.message}</p>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
              <h3>📈 Quick Stats</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Transactions</div>
                  <div className="stat-value">{expenses.length}</div>
                </div>
                {expenses.length > 0 && (
                  <>
                    <div className="stat-card">
                      <div className="stat-label">Average Transaction</div>
                      <div className="stat-value">${(totalSpent / expenses.length).toFixed(2)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Largest Expense</div>
                      <div className="stat-value">${Math.max(...expenses.map(e => parseFloat(e.amount || 0))).toFixed(2)}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'add' && (
          <div className="add-tab">
            <div className="form-section">
              <ExpenseForm onExpenseAdded={handleExpenseAdded} />
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="list-tab">
            <div className="list-section">
              <ExpenseList refreshTrigger={refreshTrigger} />
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="budget-tab">
            <div className="list-section">
              <h2>💰 Budget Management</h2>
              <p>Monitor and manage your monthly budget allocations. Track your spending against set limits to maintain financial discipline.</p>
              
              {/* Budget Configuration Form */}
              <div className="budget-config">
                <h3>⚙️ Configure Budget & Income</h3>
                <div className="budget-inputs">
                  <div className="input-group">
                    <label htmlFor="income">Monthly Income ($)</label>
                    <input
                      id="income"
                      type="number"
                      min="0"
                      step="0.01"
                      value={incomeInput}
                      onChange={(e) => setIncomeInput(e.target.value)}
                      placeholder="Enter monthly income"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="budget">Monthly Budget ($)</label>
                    <input
                      id="budget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      placeholder="Enter budget limit"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  onClick={handleBudgetSave}
                  className="save-budget-btn"
                  disabled={isLoading}
                  style={{ marginTop: '1rem' }}
                >
                  {isLoading ? 'Loading...' : '💾 Save Budget & Income'}
                </button>

                {saveError && <p className="error-message" style={{ marginTop: '1rem', color: '#ff6b6b' }}>{saveError}</p>}
              </div>

              {/* Budget Summary */}
              <div className="budget-summary">
                <div className="summary-item">
                  <span className="label">Monthly Budget</span>
                  <span className="value">${budget !== null ? budget.toFixed(2) : '0.00'}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Total Spent</span>
                  <span className="value">${totalSpent.toFixed(2)}</span>
                </div>
                {budget !== null && budget > 0 && (
                  <>
                    <div className="summary-item">
                      <span className="label">Remaining Budget</span>
                      <span className={`value ${budgetMetrics.remaining < 0 ? 'negative' : 'positive'}`}>
                        ${Math.abs(budgetMetrics.remaining).toFixed(2)}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Budget Usage</span>
                      <span className="value">{budgetMetrics.percent.toFixed(1)}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-tab">
            <div className="list-section">
              <div className="report-header">
                <h2>📊 Financial Analytics Report</h2>
                <div className="report-date">Generated on {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>

              <div className="report-section">
                <h3>Executive Summary</h3>
                <div className="analytics-description">
                  This comprehensive financial report provides detailed insights into your spending patterns, 
                  transaction history, and budget performance metrics for the current period.
                </div>

                <div className="metric-grid">
                  <div className="metric-card">
                    <div className="metric-label">Total Expenditure</div>
                    <div className="metric-value">${totalSpent.toFixed(2)}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Total Transactions</div>
                    <div className="metric-value">{expenses.length}</div>
                  </div>
                  {expenses.length > 0 && (
                    <>
                      <div className="metric-card">
                        <div className="metric-label">Average Transaction</div>
                        <div className="metric-value">${(totalSpent / expenses.length).toFixed(2)}</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-label">Largest Expense</div>
                        <div className="metric-value">
                          ${Math.max(...expenses.map(e => parseFloat(e.amount || 0))).toFixed(2)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="report-section">
                <h3>Visual Analytics</h3>
                <div className="analytics-description">
                  The charts below illustrate spending distribution by category and temporal trends 
                  to help identify key patterns and optimization opportunities.
                </div>
                <div className="charts-section">
                  <ExpenseCharts expenses={expenses} />
                </div>
              </div>

              {budget !== null && budget > 0 && (
                <div className="report-section">
                  <h3>Budget Performance Analysis</h3>
                  <div className="metric-grid">
                    <div className="metric-card">
                      <div className="metric-label">Allocated Budget</div>
                      <div className="metric-value">${budget.toFixed(2)}</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Budget Utilization</div>
                      <div className="metric-value">{budgetMetrics.percent.toFixed(1)}%</div>
                      <div className={`metric-change ${budgetMetrics.percent <= 80 ? 'positive' : 'negative'}`}>
                        {budgetMetrics.percent <= 80 ? '✓ Within Target' : '⚠ Approaching Limit'}
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Remaining Funds</div>
                      <div className="metric-value">${Math.abs(budgetMetrics.remaining).toFixed(2)}</div>
                      <div className={`metric-change ${budgetMetrics.remaining >= 0 ? 'positive' : 'negative'}`}>
                        {budgetMetrics.remaining >= 0 ? 'Available' : 'Exceeded'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="report-section">
                <h3>Recommendations</h3>
                <div className="analytics-description">
                  {expenses.length === 0 ? (
                    "No transaction data available. Begin tracking expenses to generate personalized insights."
                  ) : budgetMetrics.percent > 100 ? (
                    "Budget exceeded. Review discretionary spending and consider adjusting category allocations."
                  ) : budgetMetrics.percent > 80 ? (
                    "Approaching budget limit. Monitor spending closely and prioritize essential expenses."
                  ) : (
                    "Budget performance is healthy. Continue current spending patterns and consider allocating surplus to savings."
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="about-tab">
            <div className="list-section">
              <h2>ℹ️ About FinanceTracker</h2>
              
              <div className="app-info">
                <p><strong>Application Version:</strong> 1.0.0</p>
                <p><strong>Release Date:</strong> November 2025</p>
                <p><strong>Developer:</strong> Suyash</p>
                <p><strong>Platform:</strong> Web Application (React + Firebase)</p>
              </div>

              <h3>Overview</h3>
              <p>
                FinanceTracker is a comprehensive personal finance management platform designed to 
                simplify expense tracking and provide actionable insights into your spending habits. 
                Built with modern web technologies, it offers a seamless experience across all devices.
              </p>

              <h3>Core Features</h3>
              <div className="feature-grid">
                <div className="feature-card">
                  <div className="feature-icon-large">📊</div>
                  <h4>Visual Analytics</h4>
                  <p>Interactive charts and graphs to visualize spending patterns</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon-large">🎤</div>
                  <h4>Voice Input</h4>
                  <p>Hands-free expense entry using voice recognition</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon-large">💰</div>
                  <h4>Budget Tracking</h4>
                  <p>Set limits and receive alerts when approaching thresholds</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon-large">🔒</div>
                  <h4>Secure Storage</h4>
                  <p>Cloud-based data protection with Firebase authentication</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon-large">📱</div>
                  <h4>Responsive Design</h4>
                  <p>Optimized interface for desktop, tablet, and mobile</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon-large">📈</div>
                  <h4>Real-time Sync</h4>
                  <p>Instant data synchronization across all your devices</p>
                </div>
              </div>

              <h3>Technology Stack</h3>
              <p><strong>Frontend:</strong> React 19, Vite, Chart.js</p>
              <p><strong>Backend:</strong> Firebase (Authentication, Firestore Database)</p>
              <p><strong>Deployment:</strong> GitHub Pages</p>

              <h3>Open Source</h3>
              <p>
                This project is open source and available on GitHub. Contributions, issues, 
                and feature requests are welcome!
              </p>
              <p>
                <strong>Repository:</strong> <a href="https://github.com/Suyash-666/finance-tracker" target="_blank" rel="noopener noreferrer">
                  github.com/Suyash-666/finance-tracker
                </a>
              </p>
            </div>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="help-tab">
            <div className="list-section">
              <h2>❓ Help & Support Center</h2>

              <div className="help-section">
                <h3>Getting Started Guide</h3>
                <p>Welcome to FinanceTracker! Follow these steps to begin managing your finances:</p>
                <ol>
                  <li>
                    <strong>Set Your Budget:</strong> Navigate to the Overview tab and configure your 
                    monthly income and budget limits using the input fields provided.
                  </li>
                  <li>
                    <strong>Add Expenses:</strong> Click the "Add Expense" tab to record transactions. 
                    You can enter data manually or use the voice input feature for hands-free entry.
                  </li>
                  <li>
                    <strong>Review Transactions:</strong> Access "All Expenses" to view, edit, or 
                    delete your transaction history.
                  </li>
                  <li>
                    <strong>Monitor Analytics:</strong> Use the Overview and Reports tabs to visualize 
                    your spending patterns through interactive charts.
                  </li>
                  <li>
                    <strong>Track Budget:</strong> Visit the Budget tab to monitor your spending 
                    against allocated limits and view remaining funds.
                  </li>
                </ol>
              </div>

              <div className="help-section">
                <h3>Frequently Asked Questions</h3>
                
                <div className="faq-item">
                  <strong>Q: How do I edit or delete an expense?</strong>
                  <p>
                    Navigate to "All Expenses" tab where each transaction has edit and delete icons. 
                    Click the pencil icon to modify details or the trash icon to remove an entry.
                  </p>
                </div>

                <div className="faq-item">
                  <strong>Q: Can I access my data from multiple devices?</strong>
                  <p>
                    Yes! Your data is stored securely in the cloud via Firebase. Sign in with the same 
                    account on any device to access your expenses, budget, and analytics in real-time.
                  </p>
                </div>

                <div className="faq-item">
                  <strong>Q: How does the voice input feature work?</strong>
                  <p>
                    Click the microphone icon on the Add Expense form and speak your expense details. 
                    The system will automatically parse the amount, category, and description. Ensure 
                    your browser has microphone permissions enabled.
                  </p>
                </div>

                <div className="faq-item">
                  <strong>Q: Is my financial data secure?</strong>
                  <p>
                    Absolutely! All data is encrypted and stored in Google Firebase with industry-standard 
                    security protocols. Your information is only accessible through your authenticated account.
                  </p>
                </div>

                <div className="faq-item">
                  <strong>Q: Can I export my expense data?</strong>
                  <p>
                    Data export functionality is currently in development and will be available in a 
                    future update. You'll be able to export to CSV and PDF formats.
                  </p>
                </div>

                <div className="faq-item">
                  <strong>Q: What browsers are supported?</strong>
                  <p>
                    FinanceTracker works on all modern browsers including Chrome, Firefox, Safari, and Edge. 
                    For the best experience, we recommend using the latest version of Google Chrome.
                  </p>
                </div>
              </div>

              <div className="help-section">
                <h3>Troubleshooting</h3>
                <ul>
                  <li><strong>Voice input not working:</strong> Check browser microphone permissions in settings</li>
                  <li><strong>Data not syncing:</strong> Verify internet connection and refresh the page</li>
                  <li><strong>Charts not displaying:</strong> Ensure you have added at least one expense</li>
                  <li><strong>Login issues:</strong> Clear browser cache and cookies, then try again</li>
                </ul>
              </div>

              <div className="contact-card">
                <h3>Need Additional Support?</h3>
                <p>Our support team is here to help you with any questions or technical issues.</p>
                <p><strong>Email:</strong> <a href="mailto:support@financetracker.com">support@financetracker.com</a></p>
                <p><strong>Response Time:</strong> Within 24-48 hours</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="feedback-tab">
            <div className="list-section">
              <div className="report-header">
                <h2>💬 Your Personalized Financial Feedback</h2>
                <div className="report-date">Generated on {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>

              {expenses.length === 0 ? (
                <div className="feedback-empty">
                  <h3>📊 Start Tracking to Get Insights</h3>
                  <p>Add your first expense to receive personalized feedback and recommendations!</p>
                  <div className="budget-controls">
                    <button onClick={() => setActiveTab('add')}>➕ Add Your First Expense</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="report-section">
                    <h3>🎯 Overall Performance</h3>
                    <div className="feedback-card">
                      {budgetMetrics.percent <= 50 ? (
                        <>
                          <div className="feedback-icon">🌟</div>
                          <h4>Excellent Financial Discipline!</h4>
                          <p>
                            You've spent only {budgetMetrics.percent.toFixed(1)}% of your budget. 
                            This demonstrates strong self-control and effective expense management. 
                            Keep up this outstanding performance!
                          </p>
                        </>
                      ) : budgetMetrics.percent <= 80 ? (
                        <>
                          <div className="feedback-icon">✅</div>
                          <h4>Good Budget Management</h4>
                          <p>
                            You're at {budgetMetrics.percent.toFixed(1)}% of your budget allocation. 
                            You're on the right track! Continue monitoring your expenses to maintain 
                            this healthy spending pattern.
                          </p>
                        </>
                      ) : budgetMetrics.percent < 100 ? (
                        <>
                          <div className="feedback-icon">⚠️</div>
                          <h4>Approaching Budget Limit</h4>
                          <p>
                            You've used {budgetMetrics.percent.toFixed(1)}% of your budget. 
                            Consider slowing down discretionary spending and focus on essential 
                            purchases for the remainder of the month.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="feedback-icon">🚨</div>
                          <h4>Budget Exceeded - Action Required</h4>
                          <p>
                            You've exceeded your budget by ${Math.abs(budgetMetrics.remaining).toFixed(2)}. 
                            Review your recent expenses and identify areas where you can reduce spending. 
                            Consider adjusting your budget if current limits are unrealistic.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="report-section">
                    <h3>💡 Smart Recommendations</h3>
                    <div className="recommendations-grid">
                      {budgetMetrics.savingsPercent >= 20 && income > 0 && (
                        <div className="recommendation-card positive">
                          <div className="rec-icon">💰</div>
                          <h4>Strong Savings Habit</h4>
                          <p>
                            You're saving {budgetMetrics.savingsPercent.toFixed(1)}% of your income. 
                            Consider investing this surplus in index funds or high-yield savings accounts 
                            for long-term wealth building.
                          </p>
                        </div>
                      )}
                      
                      {expenses.length >= 5 && (
                        <div className="recommendation-card info">
                          <div className="rec-icon">📊</div>
                          <h4>Track Spending Patterns</h4>
                          <p>
                            With {expenses.length} transactions recorded, you now have enough data for 
                            meaningful insights. Check the Reports tab to identify your top spending categories.
                          </p>
                        </div>
                      )}

                      {(totalSpent / expenses.length) > 50 && expenses.length >= 3 && (
                        <div className="recommendation-card warning">
                          <div className="rec-icon">💳</div>
                          <h4>High Average Transaction</h4>
                          <p>
                            Your average transaction is ${(totalSpent / expenses.length).toFixed(2)}. 
                            Consider breaking down larger purchases or reviewing if these expenses align 
                            with your financial goals.
                          </p>
                        </div>
                      )}

                      {budgetMetrics.remaining > 0 && budgetMetrics.percent < 70 && budget > 0 && (
                        <div className="recommendation-card positive">
                          <div className="rec-icon">🎉</div>
                          <h4>Budget Cushion Available</h4>
                          <p>
                            You have ${budgetMetrics.remaining.toFixed(2)} remaining in your budget. 
                            This gives you flexibility for planned purchases or unexpected expenses.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="report-section">
                    <h3>📈 Progress Insights</h3>
                    <div className="analytics-description">
                      <p><strong>Transaction Volume:</strong> You've logged {expenses.length} expense{expenses.length !== 1 ? 's' : ''} so far.</p>
                      <p><strong>Spending Consistency:</strong> Average transaction value is ${(totalSpent / expenses.length).toFixed(2)}.</p>
                      {income > 0 && (
                        <p><strong>Income Utilization:</strong> You've spent {((totalSpent / income) * 100).toFixed(1)}% of your monthly income.</p>
                      )}
                    </div>
                  </div>

                  <div className="report-section">
                    <h3>🎯 Next Steps</h3>
                    <div className="next-steps">
                      <ul>
                        {budgetMetrics.percent > 80 && budget > 0 && (
                          <li>Review non-essential expenses and identify cutback opportunities</li>
                        )}
                        {!income || income === 0 && (
                          <li>Set your monthly income in the Budget tab for better savings tracking</li>
                        )}
                        {expenses.length < 10 && (
                          <li>Continue tracking all expenses for more accurate financial insights</li>
                        )}
                        {budgetMetrics.savingsPercent < 10 && income > 0 && (
                          <li>Aim to increase your savings rate to at least 20% of income</li>
                        )}
                        <li>Review the Reports tab weekly to stay aware of spending trends</li>
                        <li>Set specific financial goals (emergency fund, investment targets, etc.)</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Security section removed (no MFA) */}
      </main>
    </div>
  );
};

export default Dashboard;
