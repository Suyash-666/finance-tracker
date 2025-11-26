// src/components/Feedback.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/ModernClean.css';

const Feedback = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState('general');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }
    
    if (!message.trim()) {
      toast.error('Please write your feedback');
      return;
    }

    // In a real app, this would send to a backend
    console.log('Feedback submitted:', { rating, feedbackType, message });
    
    toast.success('Thank you for your feedback!');
    setRating(0);
    setFeedbackType('general');
    setMessage('');
  };

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>

        <h2 className="page-title">Send Feedback</h2>
        <p className="page-subtitle">We'd love to hear from you!</p>

        <form className="feedback-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Rate Your Experience</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              ))}
            </div>
            <p className="rating-text">
              {rating === 0 && 'Click to rate'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>

          <div className="form-group">
            <label>Feedback Type</label>
            <select 
              value={feedbackType} 
              onChange={(e) => setFeedbackType(e.target.value)}
              className="feedback-select"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="improvement">Improvement Suggestion</option>
            </select>
          </div>

          <div className="form-group">
            <label>Your Feedback</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you think..."
              rows="6"
              className="feedback-textarea"
            />
          </div>

          <button type="submit" className="submit-btn">
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
