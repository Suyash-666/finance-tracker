// src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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

    return () => unsubscribe();
  }, [refreshTrigger]);

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
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="charts-section">
              <ExpenseCharts expenses={expenses} />
            </div>
          </div>
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
      </main>
    </div>
  );
};

export default Dashboard;