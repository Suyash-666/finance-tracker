// src/components/Budget.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { toast } from 'react-toastify';
import { FaArrowLeft } from 'react-icons/fa';
import '../styles/ModernClean.css';

const Budget = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);

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
  }, []);

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

    try {
      const budgetRef = doc(db, 'budgets', auth.currentUser.uid);
      await setDoc(budgetRef, {
        amount: budgetValue,
        income: incomeValue,
        updatedAt: new Date().toISOString()
      });

      setBudget(budgetValue);
      setIncome(incomeValue);
      toast.success('Budget and income saved successfully!');
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Failed to save budget');
      setSaveError('Failed to save budget. Please try again.');
    }
  };

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown = {};
    expenses.forEach((expense) => {
      const category = expense.category || 'Other';
      breakdown[category] = (breakdown[category] || 0) + parseFloat(expense.amount || 0);
    });
    return Object.entries(breakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  return (
    <div className="budget-page">
      <div className="budget-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1>Budget Management</h1>
      </div>

      <div className="budget-content">
        {/* Budget Configuration */}
        <div className="budget-config-section">
          <h2>Configure Your Budget</h2>
          {isLoading ? (
            <div className="loading">Loading budget data...</div>
          ) : (
            <div className="budget-form">
              <div className="form-group">
                <label>Monthly Income ($)</label>
                <input
                  type="number"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  placeholder="Enter your monthly income"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Monthly Budget ($)</label>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder="Enter your monthly budget"
                  min="0"
                  step="0.01"
                />
              </div>
              {saveError && <div className="error-message">{saveError}</div>}
              <button className="save-button" onClick={handleBudgetSave}>
                Save Budget
              </button>
            </div>
          )}
        </div>

        {/* Budget Summary */}
        {budget !== null && budget > 0 && (
          <div className="budget-summary-section">
            <h2>Budget Summary</h2>
            <div className="summary-cards">
              <div className="summary-card income">
                <h3>Monthly Income</h3>
                <p className="amount">${income?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="summary-card budget">
                <h3>Monthly Budget</h3>
                <p className="amount">${budget.toFixed(2)}</p>
              </div>
              <div className="summary-card spent">
                <h3>Total Spent</h3>
                <p className="amount">${totalSpent.toFixed(2)}</p>
              </div>
              <div className={`summary-card remaining ${budgetMetrics.remaining < 0 ? 'negative' : ''}`}>
                <h3>Remaining</h3>
                <p className="amount">${budgetMetrics.remaining.toFixed(2)}</p>
              </div>
            </div>

            {/* Budget Alert */}
            {budgetAlert && (
              <div className={`budget-alert ${budgetAlert.className}`}>
                <strong>{budgetAlert.level === 'critical' ? '⚠️' : budgetAlert.level === 'warning' ? '⚡' : budgetAlert.level === 'info' ? 'ℹ️' : '✅'}</strong>
                <span>{budgetAlert.message}</span>
              </div>
            )}

            {/* Progress Bar */}
            <div className="budget-progress">
              <div className="progress-header">
                <span>Budget Usage</span>
                <span>{budgetMetrics.percent.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${budgetMetrics.percent >= 100 ? 'exceeded' : budgetMetrics.percent >= 80 ? 'warning' : ''}`}
                  style={{ width: `${Math.min(budgetMetrics.percent, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Investment Tip */}
            {income > 0 && (
              <div className={`investment-tip tip-${investmentTip.type}`}>
                <h3>💡 {investmentTip.title}</h3>
                <p>{investmentTip.message}</p>
              </div>
            )}
          </div>
        )}

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="category-breakdown-section">
            <h2>Spending by Category</h2>
            <div className="category-list">
              {categoryBreakdown.map(({ category, amount }) => (
                <div key={category} className="category-item">
                  <div className="category-info">
                    <span className="category-name">{category}</span>
                    <span className="category-amount">${amount.toFixed(2)}</span>
                  </div>
                  <div className="category-bar">
                    <div
                      className="category-fill"
                      style={{
                        width: `${budget > 0 ? (amount / budget) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <span className="category-percent">
                    {budget > 0 ? ((amount / budget) * 100).toFixed(1) : 0}% of budget
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Budget;
