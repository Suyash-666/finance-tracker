// src/components/Auth.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { FaGoogle, FaEye, FaEyeSlash, FaChartLine } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/ModernClean.css';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
    } else if (mode === 'login') {
      setIsLogin(true);
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!');
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in with Google!');
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="auth-content">
        <div className="auth-header">
          <div className="logo">
            <FaChartLine className="logo-icon" />
            <h1>FinanceTracker</h1>
          </div>
          <p className="subtitle">Smart expense tracking made simple</p>
        </div>

        <div className="auth-card">
          <div className="card-header">
            <h2>{isLogin ? 'Welcome Back!' : 'Join Us Today!'}</h2>
            <p>{isLogin ? 'Sign in to your account' : 'Create your account'}</p>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="google-button"
          >
            <FaGoogle className="google-icon" />
            {loading ? 'Connecting...' : `Continue with Google`}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <div className="input-wrapper">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength="6"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-button">
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="auth-switch">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="switch-button"
                disabled={loading}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        <div className="features">
          <div className="feature">
            <div className="feature-icon">📊</div>
            <span>Visual Analytics</span>
          </div>
          <div className="feature">
            <div className="feature-icon">🎤</div>
            <span>Voice Commands</span>
          </div>
          <div className="feature">
            <div className="feature-icon">🔒</div>
            <span>Secure & Private</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;