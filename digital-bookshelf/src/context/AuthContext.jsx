import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          handleLogoutCleanup();
        }
      } else {
        handleLogoutCleanup();
      }
    } catch (error) {
      console.error("Ошибка проверки аутентификации:", error);
      handleLogoutCleanup();
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutCleanup = () => {
    authService.logout();
    setUser(null);
  };

  const login = async (credentials) => {
    try {
      const userData = await authService.login(credentials);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const newUser = await authService.register(userData);
      return newUser;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    handleLogoutCleanup();
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.refreshUserData();
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    checkAuth,
    isAuthenticated: !!user,
  };

  if (loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}
      >
        Загрузка...
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth должен использоваться внутри AuthProvider");
  }
  return context;
};
