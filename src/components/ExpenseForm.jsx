// src/components/ExpenseForm.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import speechRecognition from '../services/speechRecognition';
import { toast } from 'react-toastify';
import '../styles/ModernClean.css';

const ExpenseForm = ({ onExpenseAdded }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speechStatus, setSpeechStatus] = useState('');

  const categories = [
    { value: 'food', label: 'Food & Dining' },
    { value: 'transport', label: 'Transportation' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'bills', label: 'Bills & Utilities' },
    { value: 'health', label: 'Health & Medical' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (!speechRecognition.isSupported()) {
      setSpeechStatus('Speech recognition not supported in this browser');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || !description) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const expenseData = {
        amount: parseFloat(amount),
        description: description.trim(),
        category,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        date: new Date().toISOString().split('T')[0]
      };

      await addDoc(collection(db, 'expenses'), expenseData);
      
      // Reset form
      setAmount('');
      setDescription('');
      setCategory('other');
      
      // Notify parent component
      if (onExpenseAdded) {
        onExpenseAdded();
      }

      toast.success('Expense added successfully!');
      setSpeechStatus('');
      
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Error adding expense');
      setSpeechStatus('Error adding expense');
    }

    setLoading(false);
  };

  const startVoiceInput = () => {
    if (!speechRecognition.isSupported()) {
      toast.warning('Speech recognition not supported in this browser');
      setSpeechStatus('Speech recognition not supported');
      return;
    }

    setIsListening(true);
    toast.info('Listening... Speak now!');
    setSpeechStatus('Listening... Say something like "add 50 for groceries"');

    speechRecognition.startListening(
      (expenseData, transcript) => {
        console.log('Parsed expense data:', expenseData);
        
        if (expenseData.amount) {
          setAmount(expenseData.amount.toString());
        }
        
        if (expenseData.description) {
          setDescription(expenseData.description);
        }
        
        if (expenseData.category !== 'other') {
          setCategory(expenseData.category);
        }

        toast.success(`Recognized: "${transcript}"`);
        setSpeechStatus(`Heard: "${transcript}"`);
        setIsListening(false);
      },
      (error) => {
        console.error('Speech recognition error:', error);
        toast.error(`Voice recognition error: ${error}`);
        setSpeechStatus(`Speech recognition error: ${error}`);
        setIsListening(false);
      }
    );
  };

  const stopVoiceInput = () => {
    speechRecognition.stopListening();
    setIsListening(false);
    setSpeechStatus('Stopped listening');
  };

  return (
    <div className="expense-form-container">
      <h3>Add New Expense</h3>
      
      <div className="voice-controls">
        <button
          type="button"
          onClick={isListening ? stopVoiceInput : startVoiceInput}
          className={`voice-button ${isListening ? 'listening' : ''}`}
          disabled={loading}
        >
          {isListening ? '🛑 Stop Listening' : '🎤 Voice Input'}
        </button>
        
        {speechStatus && (
          <div className={`speech-status ${speechStatus.includes('error') ? 'error' : ''}`}>
            {speechStatus}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="expense-form">
        <div className="form-group">
          <label>Amount ($):</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={loading}
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={loading}
            placeholder="What did you spend on?"
          />
        </div>

        <div className="form-group">
          <label>Category:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
};

export default ExpenseForm;