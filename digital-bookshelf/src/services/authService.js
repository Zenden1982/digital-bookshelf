import { storage } from "../utils/storage";
import api from "./api";
export const authService = {
  register: async (userData) => {
    try {
      const { confirmPassword, ...registrationData } = userData;
      console.log("Отправка данных регистрации:", registrationData);

      const response = await api.post("/users/register", userData);

      const user = response.data;

      return user;
    } catch (error) {
      throw error;
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post("/users/login", credentials);

      const token = response.data;

      storage.setToken(token);
      console.log("Токен сохранен в хранилище.");
      const userResponse = await api.get("/users/me");
      console.log("Ответ с данными пользователя получен:", userResponse.data);
      const userData = userResponse.data;

      storage.setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    storage.clearAuth();
  },

  getCurrentUser: () => {
    return storage.getUser();
  },

  isAuthenticated: () => {
    return !!storage.hasToken();
  },

  refreshUserData: async () => {
    try {
      // Обновление данных пользователя
    } catch (error) {
      throw error;
    }
  },

  hasRole: (roleName) => {
    const user = storage.getUser();
    if (!user || !user.roles) return false;

    return user.roles.some((role) => {
      if (typeof role === "string") {
        return role === roleName;
      }
      return role.name === roleName;
    });
  },
};
