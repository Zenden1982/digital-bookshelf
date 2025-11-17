import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (isAuthenticated) {
    return children;
  }

  return <Navigate to="/login" replace />;
};

export default PrivateRoute;
