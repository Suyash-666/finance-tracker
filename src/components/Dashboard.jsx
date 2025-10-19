// src/components/Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import ExpenseCharts from './ExpenseCharts';
import { FaChartLine, FaUser, FaSignOutAlt, FaPlus, FaList, FaChartPie } from 'react-icons/fa';
import '../styles/Dashboard.css';

const Dashboard = ({ user }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expenses, setExpenses] = useState([]);
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
      setSaveError('Please enter a valid budget amount');
      return;
    }

    if (isNaN(incomeValue) || incomeValue < 0) {
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
      alert('Budget and income saved successfully!');
    } catch (error) {
      console.error('Error saving budget:', error);
      setSaveError('Failed to save budget. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
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
      <header className="dashboard-header">
        <div className="header-left">
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
            <FaList /> All Expenses
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

            {/* Budget Configuration */}
            <div className="budget-section">
              <h3>Budget & Income Settings</h3>
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
              >
                {isLoading ? 'Loading...' : 'Save Budget & Income'}
              </button>

              {saveError && <p className="error-message">{saveError}</p>}

              {/* Budget Summary */}
              {budget !== null && budget > 0 && (
                <div className="budget-summary">
                  <div className="summary-item">
                    <span className="label">Total Spent:</span>
                    <span className="value">${totalSpent.toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Budget:</span>
                    <span className="value">${budget.toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Remaining:</span>
                    <span className={`value ${budgetMetrics.remaining < 0 ? 'negative' : 'positive'}`}>
                      ${budgetMetrics.remaining.toFixed(2)}
                    </span>
                  </div>
                  {income > 0 && (
                    <div className="summary-item">
                      <span className="label">Savings:</span>
                      <span className="value">${budgetMetrics.savings.toFixed(2)} ({budgetMetrics.savingsPercent.toFixed(1)}%)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Investment Tips */}
            <div className={`investment-tips ${investmentTip.type}`}>
              <h4>{investmentTip.title}</h4>
              <p>{investmentTip.message}</p>
            </div>

            {/* Charts */}
            <div className="charts-section">
              <ExpenseCharts expenses={expenses} />
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

        {/* Security section removed (no MFA) */}
      </main>
    </div>
  );
};

export default Dashboard;
