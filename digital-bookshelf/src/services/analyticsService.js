import apiClient from "./api"; // Убедитесь, что путь правильный к вашему файлу с axios

export const analyticsService = {
  /**
   * Получает аналитику текущего пользователя.
   * Ожидается GET запрос на /api/v1/analytics
   */
  getMyAnalytics: async () => {
    // apiClient уже имеет baseURL (например, http://localhost:8080/api/v1)
    // и автоматически добавляет токен авторизации.
    const response = await apiClient.get("/analytics");
    return response.data;
  },
};
