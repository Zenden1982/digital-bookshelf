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
    if (!token) return true; // Нет токена = истёк

    try {
      const decoded = jwtDecode(token);
      // JWT содержит поле exp (expiration) в секундах Unix-времени
      const currentTime = Date.now() / 1000; // Текущее время в секундах
      return decoded.exp < currentTime; // Если exp меньше текущего времени = истёк
    } catch (error) {
      return true; // Ошибка расшифровки = считаем истёкшим
    }
  },
  getUserFromToken: () => {
    const token = storage.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return {
        username: decoded.sub, // "sub" — стандартное поле JWT для username
        roles: decoded.roles || decoded.authorities || [], // roles из вашего Spring
        id: decoded.userId || decoded.id, // если id есть в токене
      };
    } catch (error) {
      console.error("Ошибка извлечения пользователя из токена:", error);
      return null;
    }
  },

  // === ЗАГОЛОВОК АВТОРИЗАЦИИ ===

  // Получить заголовок Authorization для HTTP-запросов
  getAuthHeader: () => {
    const token = storage.getToken();
    return token ? `Bearer ${token}` : ""; // Формат: "Bearer eyJhbGc..."
  },
};
