// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ user, children }) => {
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
