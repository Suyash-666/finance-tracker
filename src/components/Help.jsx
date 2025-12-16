// src/components/Help.jsx
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaQuestionCircle, FaMicrophone, FaChartBar, FaPiggyBank } from 'react-icons/fa';
import '../styles/Help.css';

const Help = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: 'How do I add an expense?',
      answer: 'Go to the "Add Expense" tab, fill in the amount and description, select a category, and click "Add Expense". You can also use voice input by clicking the microphone button.'
    },
    {
      question: 'How does voice input work?',
      answer: 'Click the microphone icon in the Add Expense form and say something like "add 50 dollars for groceries" or "spent 20 on coffee". The app will automatically fill in the amount, description, and category.'
    },
    {
      question: 'Can I edit or delete expenses?',
      answer: 'Yes! In the expense list, click the delete button (🗑️) on any expense to remove it. Each deletion requires confirmation.'
    },
    {
      question: 'How do I set a budget?',
      answer: 'In the Overview tab, enter your monthly budget and income in the budget section, then click "Save Budget". The app will track your spending against this budget.'
    },
    {
      question: 'What do the charts show?',
      answer: 'The charts tab displays your spending breakdown by category (pie chart) and spending trends over time (line chart) to help you understand your financial patterns.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! All data is stored in Firebase with secure authentication. Only you can access your expense data with your login credentials.'
    }
  ];

  const features = [
    {
      icon: <FaMicrophone />,
      title: 'Voice Recognition',
      description: 'Add expenses hands-free using natural language voice commands'
    },
    {
      icon: <FaChartBar />,
      title: 'Visual Analytics',
      description: 'Beautiful charts showing spending patterns and category breakdowns'
    },
    {
      icon: <FaPiggyBank />,
      title: 'Budget Tracking',
      description: 'Set budgets and track your progress with real-time updates'
    },
    {
      icon: <FaQuestionCircle />,
      title: 'Smart Insights',
      description: 'Get investment tips and financial recommendations'
    }
  ];

  return (
    <div className="help-page">
      <div className="help-container">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>

        <h2 className="page-title">Help & Support</h2>

        <div className="features-section">
          <h3>Key Features</h3>
          <div className="features-grid">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-item">
                <div className="feature-icon">{feature.icon}</div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="faq-section">
          <h3>Frequently Asked Questions</h3>
          {faqs.map((faq, idx) => (
            <div key={idx} className="faq-item">
              <h4><FaQuestionCircle /> {faq.question}</h4>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="contact-section">
          <h3>Still need help?</h3>
          <p>Contact us at <a href="mailto:support@financetracker.com">support@financetracker.com</a></p>
        </div>
      </div>
    </div>
  );
};

export default Help;
