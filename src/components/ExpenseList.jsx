// src/components/ExpenseList.jsx
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import '../styles/ExpenseList.css';

const ExpenseList = ({ refreshTrigger }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

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
    if (!auth.currentUser) return;

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
      setExpenses(expensesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refreshTrigger]);

  const deleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteDoc(doc(db, 'expenses', id));
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense');
      }
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    if (filter === 'all') return true;
    return expense.category === filter;
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    switch (sortBy) {
      case 'amount':
        return b.amount - a.amount;
      case 'category':
        return a.category.localeCompare(b.category);
      case 'date':
      default:
        return new Date(b.createdAt.seconds * 1000) - new Date(a.createdAt.seconds * 1000);
    }
  });

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const formatDate = (timestamp) => {
    if (timestamp && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }
    return new Date().toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading expenses...</div>;
  }

  return (
    <div className="expense-list-container">
      <div className="list-header">
        <h3>Your Expenses</h3>
        <div className="total-amount">
          Total: ${totalAmount.toFixed(2)}
        </div>
      </div>

      <div className="controls">
        <div className="filter-group">
          <label>Filter by category:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {Object.entries(categories).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="sort-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>

      {sortedExpenses.length === 0 ? (
        <div className="no-expenses">
          {filter === 'all' 
            ? 'No expenses yet. Add your first expense!' 
            : `No expenses found for ${categories[filter]}`
          }
        </div>
      ) : (
        <div className="expenses-grid">
          {sortedExpenses.map((expense) => (
            <div key={expense.id} className="expense-card">
              <div className="expense-header">
                <span className={`category-badge ${expense.category}`}>
                  {categories[expense.category]}
                </span>
                <button
                  onClick={() => deleteExpense(expense.id)}
                  className="delete-button"
                  title="Delete expense"
                >
                  🗑️
                </button>
              </div>
              
              <div className="expense-amount">
                ${expense.amount.toFixed(2)}
              </div>
              
              <div className="expense-description">
                {expense.description}
              </div>
              
              <div className="expense-date">
                {formatDate(expense.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpenseList;