// src/components/RecurringExpenses.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendar, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import '../styles/FinancialPages.css';

const RecurringExpenses = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'bills',
    frequency: 'monthly',
    dueDay: '',
    isPaid: false
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'recurring'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExpenses(expensesData);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.dueDay) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'recurring'), {
        ...formData,
        amount: parseFloat(formData.amount),
        dueDay: parseInt(formData.dueDay),
        userId: auth.currentUser.uid,
        createdAt: new Date()
      });

      toast.success('Recurring expense added!');
      setShowForm(false);
      setFormData({
        name: '',
        amount: '',
        category: 'bills',
        frequency: 'monthly',
        dueDay: '',
        isPaid: false
      });
    } catch (error) {
      toast.error('Failed to add expense');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this recurring expense?')) {
      try {
        await deleteDoc(doc(db, 'recurring', id));
        toast.success('Deleted successfully');
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  const togglePaid = async (expense) => {
    try {
      await updateDoc(doc(db, 'recurring', expense.id), {
        isPaid: !expense.isPaid
      });
      toast.success(expense.isPaid ? 'Marked as unpaid' : 'Marked as paid');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const totalMonthly = expenses.filter(e => e.frequency === 'monthly').reduce((sum, e) => sum + e.amount, 0);
  const paidThisMonth = expenses.filter(e => e.isPaid).length;

  return (
    <div className="recurring-page">
      <div className="recurring-container">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>

        <h2 className="page-title">Recurring Expenses</h2>

        <div className="recurring-summary">
          <div className="summary-card">
            <label>Monthly Total</label>
            <p className="amount">${totalMonthly.toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <label>Paid This Month</label>
            <p className="amount">{paidThisMonth}/{expenses.length}</p>
          </div>
        </div>

        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Recurring Expense'}
        </button>

        {showForm && (
          <form className="recurring-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g., Netflix Subscription" />
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="15.99" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  <option value="bills">Bills & Utilities</option>
                  <option value="subscriptions">Subscriptions</option>
                  <option value="rent">Rent/Mortgage</option>
                  <option value="insurance">Insurance</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Frequency</label>
                <select value={formData.frequency} onChange={(e) => setFormData({...formData, frequency: e.target.value})}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Due Day (1-31) *</label>
              <input type="number" min="1" max="31" value={formData.dueDay} onChange={(e) => setFormData({...formData, dueDay: e.target.value})} placeholder="15" />
            </div>

            <button type="submit" className="submit-btn">Add Expense</button>
          </form>
        )}

        <div className="expenses-list">
          {expenses.length === 0 ? (
            <p className="no-data">No recurring expenses yet. Add one to track your bills!</p>
          ) : (
            expenses.map(expense => {
              const today = new Date().getDate();
              const isDueSoon = expense.dueDay - today <= 3 && expense.dueDay - today >= 0;
              
              return (
                <div key={expense.id} className={`expense-card ${expense.isPaid ? 'paid' : ''} ${isDueSoon ? 'due-soon' : ''}`}>
                  <div className="expense-header">
                    <div className="expense-info">
                      <FaCalendar className="expense-icon" />
                      <div>
                        <h3>{expense.name}</h3>
                        <span className="expense-category">{expense.category}</span>
                      </div>
                    </div>
                    <button className="delete-btn" onClick={() => handleDelete(expense.id)}>
                      <FaTrash />
                    </button>
                  </div>

                  <div className="expense-details">
                    <div className="detail-item">
                      <label>Amount</label>
                      <p className="expense-amount">${expense.amount.toFixed(2)}</p>
                    </div>
                    <div className="detail-item">
                      <label>Frequency</label>
                      <p>{expense.frequency}</p>
                    </div>
                    <div className="detail-item">
                      <label>Due Day</label>
                      <p>{expense.dueDay}{isDueSoon && ' (Due Soon!)'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Status</label>
                      <p className={expense.isPaid ? 'status-paid' : 'status-unpaid'}>
                        {expense.isPaid ? 'Paid' : 'Unpaid'}
                      </p>
                    </div>
                  </div>

                  <button 
                    className={`toggle-btn ${expense.isPaid ? 'paid-btn' : 'unpaid-btn'}`}
                    onClick={() => togglePaid(expense)}
                  >
                    {expense.isPaid ? <><FaTimes /> Mark Unpaid</> : <><FaCheck /> Mark Paid</>}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default RecurringExpenses;
