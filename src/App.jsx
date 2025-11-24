// src/App.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './components/NotFound';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />

      {/* Public routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Auth defaultMode="login" />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/dashboard" replace /> : <Auth defaultMode="signup" />}
      />

      {/* Protected routes */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute user={user}>
            <Dashboard user={user} />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;