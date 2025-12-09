// src/routes/AdminRoute.jsx

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!authService.hasRole("ROLE_ADMIN")) {
    return <Navigate to="/" />;
  }

  return children;
};

export default AdminRoute;
