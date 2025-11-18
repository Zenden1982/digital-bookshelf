// src/routes/AppRoutes.jsx

import { Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";

// Импорт страниц
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Chat from "../pages/Chat";
import Home from "../pages/Home";
import ImportPage from "../pages/ImportPage"; // <<< ИМПОРТИРУЕМ НОВУЮ СТРАНИЦУ
import MyCatalog from "../pages/MyCatalog";
import Reader from "../pages/Reader";
import SearchResults from "../pages/SearchResults";

const AppRoutes = () => {
  return (
    <Routes>
      {/* ПУБЛИЧНЫЕ МАРШРУТЫ */}
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

      {/* ПРИВАТНЫЕ МАРШРУТЫ */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/search"
        element={
          <PrivateRoute>
            <SearchResults />
          </PrivateRoute>
        }
      />
      <Route
        path="/my-catalog"
        element={
          <PrivateRoute>
            <MyCatalog />
          </PrivateRoute>
        }
      />

      {/* НОВЫЙ МАРШРУТ ДЛЯ ИМПОРТА */}
      <Route
        path="/import"
        element={
          <PrivateRoute>
            <ImportPage />
          </PrivateRoute>
        }
      />

      {/* --- Заглушки --- */}
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
        }
      />
      <Route
        path="/analytics"
        element={
          <PrivateRoute>
            <Chat />
          </PrivateRoute>
        }
      />

      {/* Редирект */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
