// src/routes/AppRoutes.jsx

import { Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";

// Импорт страниц
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Books from "../pages/Books";
import Chat from "../pages/Chat";
import Home from "../pages/Home";
import Reader from "../pages/Reader";
import SearchResults from "../pages/SearchResults"; // <<< ИМПОРТИРУЕМ НОВУЮ СТРАНИЦУ

const AppRoutes = () => {
  return (
    <Routes>
      {/* === ПУБЛИЧНЫЕ МАРШРУТЫ === */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* === ПРИВАТНЫЕ МАРШРУТЫ === */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />

      {/* === НОВЫЙ МАРШРУТ ДЛЯ СТРАНИЦЫ ПОИСКА === */}
      <Route
        path="/search"
        element={
          <PrivateRoute>
            <SearchResults />
          </PrivateRoute>
        }
      />

      {/* --- Заглушки для будущих страниц из хедера --- */}
      <Route
        path="/my-catalog"
        element={
          <PrivateRoute>
            <Books />
          </PrivateRoute>
        }
      />
      <Route
        path="/reader/:bookId"
        element={
          <PrivateRoute>
            <Reader />
          </PrivateRoute>
        }
      />
      <Route
        path="/map"
        element={
          <PrivateRoute>
            <Chat />
          </PrivateRoute>
        } // Используем заглушку Chat для Карты
      />
      <Route
        path="/analytics"
        element={
          <PrivateRoute>
            <Chat />
          </PrivateRoute>
        } // Используем заглушку Chat для Аналитики
      />

      {/* Страница не найдена - редирект на главную */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
