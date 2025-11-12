import { Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";

import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Books from "../pages/Books";
import Home from "../pages/Home";
import Reader from "../pages/Reader";

const AppRoutes = () => {
  return (
    <Routes>
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
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/books"
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
