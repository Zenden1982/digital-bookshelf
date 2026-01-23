// src/services/bookService.js
import api from "./api";

export const bookService = {
  // =========================================================
  // BASIC BOOK OPERATIONS
  // =========================================================

  searchLocal: async (query, page = 0, size = 20) => {
    try {
      if (!query || query.trim() === "") {
        return { content: [], totalElements: 0, totalPages: 0, number: 0 };
      }
      const response = await api.get("/books/search", {
        params: { query, page, size },
      });
      return response.data;
    } catch (error) {
      console.error("Ошибка при поиске по локальной базе:", error);
      throw error;
    }
  },

  getBookById: async (bookId) => {
    try {
      const response = await api.get(`/books/${bookId}`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при получении книги с ID ${bookId}:`, error);
      throw error;
    }
  },

  // Алиас для getBookById, если используется в разных местах
  getBookDetail: async (bookId) => {
    return bookService.getBookById(bookId);
  },

  getAllBooks: async (page = 0, size = 20) => {
    try {
      const response = await api.get("/books", { params: { page, size } });
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении списка всех книг:", error);
      throw error;
    }
  },

  getBookContent: async (bookId) => {
    try {
      const response = await api.get(`/books/${bookId}/content`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при получении контента книги ${bookId}:`, error);
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // =========================================================
  // LEGACY / DIRECT SEARCH (Optional)
  // =========================================================

  findSimilarBooksByQuery: async (query, topK = 50, page = 0, size = 12) => {
    try {
      const response = await api.get("/books/similar", {
        params: { query, topK, page, size },
      });
      return response.data;
    } catch (error) {
      console.error(`Ошибка поиска при запросе "${query}"`, error);
      throw error;
    }
  },

  findSimilarBooks: async (bookId, limit = 5) => {
    try {
      const response = await api.get(`/books/${bookId}/similar`, {
        params: { limit },
      });
      return response.data; // List<BookReadDTO>
    } catch (error) {
      console.error(`Ошибка при поиске похожих книг для ID=${bookId}:`, error);
      return [];
    }
  },

  // =========================================================
  // AI RECOMMENDATIONS V2 (NEW SYSTEM)
  // =========================================================

  // 1. Блок "История" (Потому что вы читали...)
  getHistoryRecommendations: async (page = 0, size = 10) => {
    try {
      const response = await api.get("/recommendations/history", {
        params: { page, size },
      });
      return response.data; // Page<RecommendationResultDTO>
    } catch (error) {
      console.error("Ошибка получения рекомендаций по истории:", error);
      throw error;
    }
  },

  // 2. Блок "Неожиданное" (Serendipity)
  getSerendipityRecommendations: async (page = 0, size = 10) => {
    try {
      const response = await api.get("/recommendations/serendipity", {
        params: { page, size },
      });
      return response.data; // Page<RecommendationResultDTO>
    } catch (error) {
      console.error("Ошибка получения неожиданных рекомендаций:", error);
      throw error;
    }
  },

  // 3. Блок "Настроение" (Интерактивный поиск)
  getMoodRecommendations: async (
    text,
    length = "ANY",
    age = "ANY",
    page = 0,
    size = 10,
  ) => {
    try {
      const response = await api.get("/recommendations/mood", {
        params: { text, length, age, page, size },
      });
      return response.data; // Page<RecommendationResultDTO>
    } catch (error) {
      console.error("Ошибка получения рекомендаций по настроению:", error);
      throw error;
    }
  },

  // 4. Карточка книги: "Похожие на эту книгу"
  getRecommendationsSimilarTo: async (bookId, page = 0, size = 10) => {
    try {
      const response = await api.get(`/recommendations/similar-to/${bookId}`, {
        params: { page, size },
      });
      return response.data; // Page<RecommendationResultDTO>
    } catch (error) {
      console.error("Ошибка при получении рекомендаций (similar-to):", error);
      throw error;
    }
  },

  // 5. Теги и старый "Миксер" (если нужен)
  getUserTags: async () => {
    try {
      const response = await api.get("/recommendations/tags");
      return response.data; // List<String>
    } catch (error) {
      console.error("Ошибка получения тегов пользователя:", error);
      return [];
    }
  },

  getRecommendationsMix: async (payload, page = 0, size = 20) => {
    try {
      const response = await api.post("/recommendations/mix", payload, {
        params: { page, size },
      });
      return response.data; // Page<RecommendationResultDTO>
    } catch (error) {
      console.error("Ошибка при получении рекомендаций (mix):", error);
      throw error;
    }
  },

  // Старый метод next (если где-то остался, можно перенаправить на history или оставить как есть)
  getRecommendationsNext: async (page = 0, size = 20, topK, threshold) => {
    try {
      // Можно перенаправить на новую логику history, если старый эндпоинт удален
      // return bookService.getHistoryRecommendations(page, size);

      // Или оставить вызов старого эндпоинта, если он есть в контроллере:
      const response = await api.get("/recommendations/next", {
        params: { page, size, topK, threshold },
      });
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении рекомендаций (next):", error);
      throw error;
    }
  },
};
