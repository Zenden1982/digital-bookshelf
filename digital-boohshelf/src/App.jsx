// src/App.jsx

import { BrowserRouter } from "react-router-dom";
import "./App.css"; // Обновим стили на следующем шаге
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";

/**
 * Внутренний компонент-макет (Layout)
 * Он имеет доступ к контексту авторизации, потому что находится внутри AuthProvider.
 */
const AppLayout = () => {
  // Получаем статус авторизации из нашего AuthContext
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      {/* 
        Условный рендеринг: 
        Показываем Header и Footer только если пользователь авторизован.
        На страницах Login и Register isAuthenticated будет false, поэтому они не появятся.
      */}
      {isAuthenticated && <Header />}

      <main className="main-content">
        <AppRoutes /> {/* Здесь будут отображаться все наши страницы */}
      </main>

      {isAuthenticated && <Footer />}
    </div>
  );
};

/**
 * Главный компонент приложения
 */
function App() {
  return (
    // 1. Оборачиваем все в BrowserRouter для работы роутинга
    <BrowserRouter>
      {/* 2. Оборачиваем в AuthProvider, чтобы все дочерние компоненты имели доступ к данным авторизации */}
      <AuthProvider>
        {/* 3. Рендерим наш компонент-макет */}
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
