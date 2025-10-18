// src/components/Auth.jsx
import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import {
  auth,
  googleProvider,
  createMfaResolverFromError,
  sendMfaSignInSms,
  resolveMfaSignInWithSms
} from '../services/firebase';
import { FaGoogle, FaEye, FaEyeSlash, FaChartLine } from 'react-icons/fa';
import '../styles/Auth.css';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // MFA state
  const [mfaResolver, setMfaResolver] = useState(null);
  const [mfaStep, setMfaStep] = useState('none'); // none | select-factor | sms-send | sms-verify
  const [mfaFactors, setMfaFactors] = useState([]);
  const [selectedFactor, setSelectedFactor] = useState(null);
  const [smsCode, setSmsCode] = useState('');
  const [smsVerificationId, setSmsVerificationId] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);

  const resetMfaState = () => {
    setMfaResolver(null);
    setMfaStep('none');
    setMfaFactors([]);
    setSelectedFactor(null);
    setSmsCode('');
    setSmsVerificationId('');
    setMfaError('');
    setMfaBusy(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      if (error?.code === 'auth/multi-factor-auth-required') {
        const resolver = createMfaResolverFromError(error);
        setMfaResolver(resolver);
        setMfaFactors(resolver.hints || []);
        setMfaStep('select-factor');
      } else {
        setError(error.message);
      }
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      if (error?.code === 'auth/multi-factor-auth-required') {
        const resolver = createMfaResolverFromError(error);
        setMfaResolver(resolver);
        setMfaFactors(resolver.hints || []);
        setMfaStep('select-factor');
      } else {
        setError(error.message);
      }
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

          {/* MFA Flow */}
          {mfaStep !== 'none' && (
            <div className="mfa-panel" style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Two‑Factor Authentication</h3>
                <button type="button" onClick={resetMfaState} disabled={mfaBusy} className="switch-button">Cancel</button>
              </div>

              {mfaError && (
                <div className="error-message" style={{ marginTop: 8 }}>
                  <span className="error-icon">⚠️</span>
                  {mfaError}
                </div>
              )}

              {mfaStep === 'select-factor' && (
                <div style={{ marginTop: 12 }}>
                  <p>Select a verification method:</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {mfaFactors.filter(h => h.factorId === 'phone').map((hint) => (
                      <li key={hint.uid} style={{ marginBottom: 8 }}>
                        <button
                          type="button"
                          className="auth-button"
                          style={{ width: '100%' }}
                          onClick={() => {
                            setSelectedFactor(hint);
                            setMfaStep('sms-send');
                          }}
                        >
                          Text message to {hint.phoneNumber || 'your phone'}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {mfaFactors.filter(h => h.factorId === 'phone').length === 0 && (
                    <div className="error-message" style={{ marginTop: 8 }}>
                      No SMS factor available on this account.
                    </div>
                  )}
                </div>
              )}

              {mfaStep === 'sms-send' && (
                <div style={{ marginTop: 12 }}>
                  <p>We will send a code to {selectedFactor?.phoneNumber || 'your phone number'}.</p>
                  {/* Invisible reCAPTCHA for MFA sign-in via SMS */}
                  <div id="recaptcha-container-auth" style={{ height: 0 }}></div>
                  <button
                    type="button"
                    className="auth-button"
                    onClick={async () => {
                      if (!mfaResolver || !selectedFactor) return;
                      setMfaBusy(true);
                      setMfaError('');
                      try {
                        const { verificationId } = await sendMfaSignInSms(
                          mfaResolver,
                          selectedFactor,
                          'recaptcha-container-auth'
                        );
                        setSmsVerificationId(verificationId);
                        setMfaStep('sms-verify');
                      } catch (e) {
                        setMfaError(e.message || 'Failed to send code');
                      } finally {
                        setMfaBusy(false);
                      }
                    }}
                    disabled={mfaBusy}
                  >
                    {mfaBusy ? 'Sending…' : 'Send Code'}
                  </button>
                </div>
              )}

              {mfaStep === 'sms-verify' && (
                <div style={{ marginTop: 12 }}>
                  <label>Enter the 6‑digit SMS code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    maxLength={8}
                    disabled={mfaBusy}
                    style={{ width: '100%', marginTop: 8 }}
                  />
                  <button
                    type="button"
                    className="auth-button"
                    onClick={async () => {
                      if (!mfaResolver || !smsVerificationId) return;
                      setMfaBusy(true);
                      setMfaError('');
                      try {
                        await resolveMfaSignInWithSms(mfaResolver, smsVerificationId, smsCode.trim());
                        resetMfaState();
                      } catch (e) {
                        setMfaError(e.message || 'Invalid code');
                      } finally {
                        setMfaBusy(false);
                      }
                    }}
                    disabled={mfaBusy || smsCode.trim().length < 6}
                    style={{ marginTop: 12 }}
                  >
                    {mfaBusy ? 'Verifying…' : 'Verify and Sign In'}
                  </button>
                </div>
              )}

              {/* SMS-based MFA is disabled in this app to avoid SMS billing. */}
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