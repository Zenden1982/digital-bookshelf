// src/routes/AppRoutes.jsx

import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoute from "./AdminRoute";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";

// Импорт страниц
import AdminPage from "../pages/Admin/AdminPage";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import BookDetailPage from "../pages/BookDetailPage";
import Chat from "../pages/Chat";
import Home from "../pages/Home";
import ImportPage from "../pages/ImportPage";
import MyCatalog from "../pages/MyCatalog";
import Reader from "../pages/Reader";
import Recommendations from "../pages/Recommendations"; // <--- НОВЫЙ ИМПОРТ
import SearchResults from "../pages/SearchResults";
import Settings from "../pages/Settings";

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
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />

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

      {/* Страница рекомендаций */}
      <Route
        path="/recommendations"
        element={
          <PrivateRoute>
            <Recommendations />
          </PrivateRoute>
        }
      />

      <Route
        path="/book/:bookId"
        element={
          <PrivateRoute>
            <BookDetailPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/import"
        element={
          <PrivateRoute>
            <ImportPage />
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

      {/* Пока заглушки Chat для карты и аналитики, можно потом заменить */}
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
