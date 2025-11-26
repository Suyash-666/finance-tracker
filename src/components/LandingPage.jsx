// src/components/LandingPage.jsx
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaRocket, FaShieldAlt, FaMobileAlt } from 'react-icons/fa';
import '../styles/ModernClean.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="hero-content">
          <div className="logo-large">
            <FaChartLine className="logo-icon-large" />
            <h1>FinanceTracker</h1>
          </div>
          <p className="tagline">Track Your Expenses, Master Your Future</p>
          
          <div className="cta-buttons">
            <button className="cta-btn primary" onClick={() => navigate('/auth?mode=signup')}>
              Get Started
            </button>
            <button className="cta-btn secondary" onClick={() => navigate('/auth?mode=login')}>
              Login
            </button>
          </div>
        </div>

        <div className="floating-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
      </div>

      <div className="features-section">
        <h2>Why Choose FinanceTracker?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <FaChartLine className="feature-icon" />
            <h3>Smart Analytics</h3>
            <p>Visualize your spending with beautiful charts and insights</p>
          </div>
          
          <div className="feature-card">
            <FaRocket className="feature-icon" />
            <h3>Voice Commands</h3>
            <p>Add expenses hands-free with voice recognition</p>
          </div>
          
          <div className="feature-card">
            <FaShieldAlt className="feature-icon" />
            <h3>Secure & Private</h3>
            <p>Your data is protected with Firebase authentication</p>
          </div>
          
          <div className="feature-card">
            <FaMobileAlt className="feature-icon" />
            <h3>Multi-Device</h3>
            <p>Access your finances anywhere, anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
