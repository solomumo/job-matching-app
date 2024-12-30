import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state or spinner while checking authentication
  if (isLoading) {
    return <div>Loading...</div>; // You can replace this with a proper loading component
  }

  if (!isAuthenticated) {
    // Redirect to login while saving the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute; 