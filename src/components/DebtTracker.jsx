// src/components/DebtTracker.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCreditCard, FaTrash, FaDollarSign } from 'react-icons/fa';
import '../styles/DebtTracker.css';

const DebtTracker = () => {
  const navigate = useNavigate();
  const [debts, setDebts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'credit-card',
    totalAmount: '',
    remainingAmount: '',
    interestRate: '',
    monthlyPayment: '',
    dueDate: ''
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'debts'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const debtsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDebts(debtsData);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.totalAmount || !formData.remainingAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'debts'), {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        remainingAmount: parseFloat(formData.remainingAmount),
        interestRate: parseFloat(formData.interestRate) || 0,
        monthlyPayment: parseFloat(formData.monthlyPayment) || 0,
        userId: auth.currentUser.uid,
        createdAt: new Date()
      });

      toast.success('Debt added successfully!');
      setShowForm(false);
      setFormData({
        name: '',
        type: 'credit-card',
        totalAmount: '',
        remainingAmount: '',
        interestRate: '',
        monthlyPayment: '',
        dueDate: ''
      });
    } catch (error) {
      toast.error('Failed to add debt');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this debt?')) {
      try {
        await deleteDoc(doc(db, 'debts', id));
        toast.success('Debt deleted successfully');
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  const handlePayment = async (debt) => {
    const payment = prompt('Enter payment amount:');
    if (!payment || isNaN(payment)) return;
    const paymentAmount = parseFloat(payment);
    const newRemaining = debt.remainingAmount - paymentAmount;
    if (newRemaining < 0) return toast.error('Payment amount exceeds remaining debt');

    try {
      await updateDoc(doc(db, 'debts', debt.id), {
        remainingAmount: newRemaining
      });
      toast.success('Payment recorded!');
    } catch {
      toast.error('Failed to record payment');
    }
  };

  const totalDebt = debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
  const totalMonthly = debts.reduce((sum, debt) => sum + (debt.monthlyPayment || 0), 0);

  return (
    <div className="debt-tracker-page">
      <div className="debt-container">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>

        <h2 className="page-title">Debt Tracker</h2>

        <div className="debt-summary">
          <div className="summary-card">
            <label>Total Debt</label>
            <p className="amount">${totalDebt.toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <label>Monthly Payments</label>
            <p className="amount">${totalMonthly.toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <label>Active Debts</label>
            <p className="amount">{debts.length}</p>
          </div>
        </div>

        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Debt'}
        </button>

        {showForm && (
          <form className="debt-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Debt Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g., Chase Credit Card" />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                  <option value="credit-card">Credit Card</option>
                  <option value="loan">Loan</option>
                  <option value="mortgage">Mortgage</option>
                  <option value="student-loan">Student Loan</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Total Amount *</label>
                <input type="number" step="0.01" value={formData.totalAmount} onChange={(e) => setFormData({...formData, totalAmount: e.target.value})} placeholder="5000" />
              </div>
              <div className="form-group">
                <label>Remaining Amount *</label>
                <input type="number" step="0.01" value={formData.remainingAmount} onChange={(e) => setFormData({...formData, remainingAmount: e.target.value})} placeholder="3500" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Interest Rate (%)</label>
                <input type="number" step="0.01" value={formData.interestRate} onChange={(e) => setFormData({...formData, interestRate: e.target.value})} placeholder="18.5" />
              </div>
              <div className="form-group">
                <label>Monthly Payment</label>
                <input type="number" step="0.01" value={formData.monthlyPayment} onChange={(e) => setFormData({...formData, monthlyPayment: e.target.value})} placeholder="150" />
              </div>
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} />
            </div>

            <button type="submit" className="submit-btn">Add Debt</button>
          </form>
        )}

        <div className="debts-list">
          {debts.length === 0 ? (
            <p className="no-data">No debts tracked yet. Add one to get started!</p>
          ) : (
            debts.map(debt => {
              const progress = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;
              return (
                <div key={debt.id} className="debt-card">
                  <div className="debt-header">
                    <div className="debt-info">
                      <FaCreditCard className="debt-icon" />
                      <div>
                        <h3>{debt.name}</h3>
                        <span className="debt-type">{debt.type.replace('-', ' ')}</span>
                      </div>
                    </div>
                    <button className="delete-btn" onClick={() => handleDelete(debt.id)}>
                      <FaTrash />
                    </button>
                  </div>

                  <div className="debt-details">
                    <div className="detail-item">
                      <label>Remaining</label>
                      <p className="remaining">${debt.remainingAmount.toFixed(2)}</p>
                    </div>
                    <div className="detail-item">
                      <label>Total</label>
                      <p>${debt.totalAmount.toFixed(2)}</p>
                    </div>
                    <div className="detail-item">
                      <label>Interest</label>
                      <p>{debt.interestRate}%</p>
                    </div>
                    <div className="detail-item">
                      <label>Monthly</label>
                      <p>${debt.monthlyPayment.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="progress-section">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: `${progress}%`}}></div>
                    </div>
                    <span className="progress-text">{progress.toFixed(1)}% paid off</span>
                  </div>

                  <button className="payment-btn" onClick={() => handlePayment(debt)}>
                    <FaDollarSign /> Record Payment
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

export default DebtTracker;
