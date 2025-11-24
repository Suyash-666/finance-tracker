// src/components/NotFound.jsx
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link to="/">Go Home</Link>
      </div>
    </div>
  );
};

export default NotFound;
