import { jwtDecode } from "jwt-decode";
import { storage } from "./storage";

export const auth = {
  decodeToken: (token) => {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error("Ошибка декодирования токена:", error);
      return null;
    }
  },

  isTokenExpired: (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  },
  getUserFromToken: () => {
    const token = storage.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return {
        username: decoded.sub,
        roles: decoded.roles || decoded.authorities || [],
        id: decoded.userId || decoded.id,
      };
    } catch (error) {
      console.error("Ошибка извлечения пользователя из токена:", error);
      return null;
    }
  },

  getAuthHeader: () => {
    const token = storage.getToken();
    return token ? `Bearer ${token}` : "";
  },
};
