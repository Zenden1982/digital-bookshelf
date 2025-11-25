// src/App.jsx

import { BrowserRouter, useLocation } from "react-router-dom";
import "./App.css";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";

const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isReaderPage = location.pathname.startsWith("/reader");

  const showLayout = isAuthenticated && !isReaderPage;

  return (
    <div className={isReaderPage ? "" : "App"}>
      {showLayout && <Header />}

      <main className={isReaderPage ? "reader-layout" : "main-content"}>
        <AppRoutes />
      </main>

      {showLayout && <Footer />}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
