// src/routes/AdminRoute.jsx

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Используем хук useAuth, как в Header
import { authService } from "../services/authService"; // Импортируем сервис

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Используем тот же метод проверки, что и в Header
  if (!authService.hasRole("ROLE_ADMIN")) {
    return <Navigate to="/" />;
  }

  return children;
};

export default AdminRoute;
