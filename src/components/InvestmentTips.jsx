// src/components/InvestmentTips.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaChartLine, FaPiggyBank, FaUniversity, FaCoins } from 'react-icons/fa';
import '../styles/ModernClean.css';

const InvestmentTips = () => {
  const navigate = useNavigate();
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  const investments = [
    {
      id: 1,
      name: 'High-Yield Savings Account',
      icon: <FaPiggyBank />,
      minAmount: 1000,
      recommendedAmount: 5000,
      source: 'Banks (Ally, Marcus, Capital One)',
      expectedReturn: '4-5% annually',
      risk: 'Very Low',
      description: 'A safe place to park your emergency fund while earning interest. FDIC insured up to $250,000.',
      pros: ['No risk', 'Liquidity', 'FDIC insured'],
      cons: ['Lower returns', 'Inflation may outpace returns']
    },
    {
      id: 2,
      name: 'Index Funds (S&P 500)',
      icon: <FaChartLine />,
      minAmount: 500,
      recommendedAmount: 10000,
      source: 'Vanguard (VOO), Fidelity (FXAIX), Schwab (SWPPX)',
      expectedReturn: '8-12% annually',
      risk: 'Medium',
      description: 'Diversified investment tracking the 500 largest US companies. Great for long-term growth.',
      pros: ['Historical growth', 'Diversification', 'Low fees'],
      cons: ['Market volatility', 'Long-term commitment needed']
    },
    {
      id: 3,
      name: 'Treasury Bonds',
      icon: <FaUniversity />,
      minAmount: 100,
      recommendedAmount: 5000,
      source: 'TreasuryDirect.gov, Banks, Brokers',
      expectedReturn: '3-5% annually',
      risk: 'Very Low',
      description: 'Government-backed bonds with guaranteed returns. Perfect for conservative investors.',
      pros: ['Government backed', 'Predictable returns', 'Tax advantages'],
      cons: ['Lower returns', 'Money locked for term']
    },
    {
      id: 4,
      name: 'Dividend Stocks',
      icon: <FaCoins />,
      minAmount: 1000,
      recommendedAmount: 15000,
      source: 'Robinhood, E-Trade, TD Ameritrade',
      expectedReturn: '5-10% annually + dividends',
      risk: 'Medium-High',
      description: 'Stocks that pay regular dividends. Provides both growth potential and passive income.',
      pros: ['Passive income', 'Growth potential', 'Compounding'],
      cons: ['Market risk', 'Research needed', 'Tax on dividends']
    },
    {
      id: 5,
      name: 'Real Estate Investment Trust (REIT)',
      icon: <FaUniversity />,
      minAmount: 1000,
      recommendedAmount: 20000,
      source: 'Fundrise, RealtyMogul, Public REITs',
      expectedReturn: '6-12% annually',
      risk: 'Medium',
      description: 'Invest in real estate without buying property. Earns from rental income and appreciation.',
      pros: ['Real estate exposure', 'Dividend income', 'Diversification'],
      cons: ['Less liquid', 'Market dependent', 'Management fees']
    },
    {
      id: 6,
      name: 'Certificate of Deposit (CD)',
      icon: <FaPiggyBank />,
      minAmount: 500,
      recommendedAmount: 10000,
      source: 'Banks (Chase, Wells Fargo, Online Banks)',
      expectedReturn: '4-5.5% annually',
      risk: 'Very Low',
      description: 'Fixed-term deposit with guaranteed interest rate. FDIC insured.',
      pros: ['Guaranteed returns', 'FDIC insured', 'Higher than savings'],
      cons: ['Money locked', 'Early withdrawal penalties', 'Inflation risk']
    }
  ];

  const calculateProjectedEarnings = (investment, amount) => {
    const returnRate = parseFloat(investment.expectedReturn) / 100;
    const oneYear = amount * returnRate;
    const fiveYears = amount * Math.pow(1 + returnRate, 5) - amount;
    return { oneYear, fiveYears };
  };

  return (
    <div className="investment-tips-page">
      <div className="investment-container">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>

        <h2 className="page-title">Investment Recommendations</h2>
        <p className="page-subtitle">
          Build your wealth with smart investment strategies
        </p>

        <div className="investments-grid">
          {investments.map((investment) => {
            const earnings = calculateProjectedEarnings(investment, investment.recommendedAmount);
            
            return (
              <div 
                key={investment.id} 
                className={`investment-card ${selectedInvestment?.id === investment.id ? 'selected' : ''}`}
                onClick={() => setSelectedInvestment(selectedInvestment?.id === investment.id ? null : investment)}
              >
                <div className="investment-header">
                  <div className="investment-icon">{investment.icon}</div>
                  <h3>{investment.name}</h3>
                </div>

                <div className="investment-stats">
                  <div className="stat">
                    <label>Min Amount</label>
                    <p>${investment.minAmount.toLocaleString()}</p>
                  </div>
                  <div className="stat">
                    <label>Recommended</label>
                    <p>${investment.recommendedAmount.toLocaleString()}</p>
                  </div>
                  <div className="stat">
                    <label>Expected Return</label>
                    <p className="return">{investment.expectedReturn}</p>
                  </div>
                  <div className="stat">
                    <label>Risk Level</label>
                    <p className={`risk ${investment.risk.toLowerCase().replace(' ', '-')}`}>
                      {investment.risk}
                    </p>
                  </div>
                </div>

                {selectedInvestment?.id === investment.id && (
                  <div className="investment-details">
                    <p className="description">{investment.description}</p>
                    
                    <div className="source-info">
                      <label>Where to Invest:</label>
                      <p>{investment.source}</p>
                    </div>

                    <div className="earnings-projection">
                      <h4>Projected Earnings (${investment.recommendedAmount.toLocaleString()} invested)</h4>
                      <div className="earnings-grid">
                        <div className="earning-item">
                          <label>1 Year</label>
                          <p>${earnings.oneYear.toFixed(2)}</p>
                        </div>
                        <div className="earning-item">
                          <label>5 Years</label>
                          <p>${earnings.fiveYears.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pros-cons">
                      <div className="pros">
                        <h5>Pros</h5>
                        <ul>
                          {investment.pros.map((pro, idx) => (
                            <li key={idx}>✓ {pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="cons">
                        <h5>Cons</h5>
                        <ul>
                          {investment.cons.map((con, idx) => (
                            <li key={idx}>✗ {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="card-footer">
                  <button className="details-btn">
                    {selectedInvestment?.id === investment.id ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="disclaimer">
          <p><strong>Disclaimer:</strong> These are general investment recommendations. Returns are historical averages and not guaranteed. Always consult with a financial advisor before making investment decisions.</p>
        </div>
      </div>
    </div>
  );
};

export default InvestmentTips;
