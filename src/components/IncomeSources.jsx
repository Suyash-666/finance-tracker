// src/components/IncomeSources.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDollarSign, FaTrash, FaChartLine } from 'react-icons/fa';
import '../styles/ModernClean.css';

const IncomeSources = () => {
  const navigate = useNavigate();
  const [sources, setSources] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    category: 'salary',
    frequency: 'monthly',
    date: new Date().toISOString().split('T')[0],
    isRecurring: true
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'income'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incomesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSources(incomesData);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.source || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'income'), {
        ...formData,
        amount: parseFloat(formData.amount),
        userId: auth.currentUser.uid,
        createdAt: new Date()
      });

      toast.success('Income source added!');
      setShowForm(false);
      setFormData({
        source: '',
        amount: '',
        category: 'salary',
        frequency: 'monthly',
        date: new Date().toISOString().split('T')[0],
        isRecurring: true
      });
    } catch (error) {
      toast.error('Failed to add income');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this income source?')) {
      try {
        await deleteDoc(doc(db, 'income', id));
        toast.success('Deleted successfully');
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  const calculateMonthlyIncome = () => {
    return sources.reduce((total, source) => {
      if (!source.isRecurring) return total;
      
      switch (source.frequency) {
        case 'weekly':
          return total + (source.amount * 4.33);
        case 'bi-weekly':
          return total + (source.amount * 2.17);
        case 'monthly':
          return total + source.amount;
        case 'yearly':
          return total + (source.amount / 12);
        default:
          return total;
      }
    }, 0);
  };

  const totalOneTime = sources
    .filter(s => !s.isRecurring)
    .reduce((sum, s) => sum + s.amount, 0);

  const monthlyIncome = calculateMonthlyIncome();

  return (
    <div className="income-page">
      <div className="income-container">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>

        <h2 className="page-title">Income Sources</h2>

        <div className="income-summary">
          <div className="summary-card">
            <label>Monthly Income</label>
            <p className="amount">${monthlyIncome.toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <label>Yearly Estimate</label>
            <p className="amount">${(monthlyIncome * 12).toFixed(2)}</p>
          </div>
          <div className="summary-card">
            <label>One-Time Income</label>
            <p className="amount">${totalOneTime.toFixed(2)}</p>
          </div>
        </div>

        <button className="add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Income Source'}
        </button>

        {showForm && (
          <form className="income-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Source *</label>
                <input type="text" value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})} placeholder="e.g., Full-Time Job" />
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="5000.00" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  <option value="salary">Salary</option>
                  <option value="freelance">Freelance</option>
                  <option value="business">Business</option>
                  <option value="investments">Investments</option>
                  <option value="side-hustle">Side Hustle</option>
                  <option value="passive">Passive Income</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Frequency</label>
                <select value={formData.frequency} onChange={(e) => setFormData({...formData, frequency: e.target.value})}>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-Time</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={formData.isRecurring} onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})} />
                  <span>Recurring Income</span>
                </label>
              </div>
            </div>

            <button type="submit" className="submit-btn">Add Income</button>
          </form>
        )}

        <div className="sources-list">
          {sources.length === 0 ? (
            <p className="no-data">No income sources yet. Add one to track your earnings!</p>
          ) : (
            sources.map(source => (
              <div key={source.id} className={`income-card ${source.isRecurring ? 'recurring' : 'one-time'}`}>
                <div className="income-header">
                  <div className="income-info">
                    <FaDollarSign className="income-icon" />
                    <div>
                      <h3>{source.source}</h3>
                      <span className="income-category">{source.category}</span>
                    </div>
                  </div>
                  <button className="delete-btn" onClick={() => handleDelete(source.id)}>
                    <FaTrash />
                  </button>
                </div>

                <div className="income-details">
                  <div className="detail-item">
                    <label>Amount</label>
                    <p className="income-amount">${source.amount.toFixed(2)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Frequency</label>
                    <p>{source.frequency}</p>
                  </div>
                  <div className="detail-item">
                    <label>Date</label>
                    <p>{new Date(source.date).toLocaleDateString()}</p>
                  </div>
                  <div className="detail-item">
                    <label>Type</label>
                    <p className={source.isRecurring ? 'type-recurring' : 'type-onetime'}>
                      {source.isRecurring ? <><FaChartLine /> Recurring</> : 'One-Time'}
                    </p>
                  </div>
                </div>

                {source.isRecurring && (
                  <div className="monthly-equivalent">
                    <label>Monthly Equivalent:</label>
                    <span>
                      ${
                        (source.frequency === 'weekly' ? source.amount * 4.33 :
                         source.frequency === 'bi-weekly' ? source.amount * 2.17 :
                         source.frequency === 'monthly' ? source.amount :
                         source.frequency === 'yearly' ? source.amount / 12 : 0).toFixed(2)
                      }
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomeSources;
