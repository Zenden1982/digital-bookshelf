import api from "./api";

export const bookService = {
  // 1. Поиск в локальной базе (используем для выбора книг в конструктор)
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

  getAllBooks: async (page = 0, size = 20) => {
    try {
      const response = await api.get("/books", {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении списка всех книг:", error);
      throw error;
    }
  },

  getBookDetail: async (bookId) => {
    try {
      const response = await api.get(`/books/${bookId}`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка детализации (ID=${bookId}):`, error);
      throw error;
    }
  },

  // 2. Семантический поиск (ГЛАВНЫЙ метод для микса)
  // Исправил синтаксическую ошибку в catch
  findSimilarBooksByQuery: async (query, topK = 50, page = 0, size = 20) => {
    try {
      // topK по умолчанию побольше, чтобы векторный поиск нашел достаточно кандидатов
      const response = await api.get(`/books/similar`, {
        params: { query, topK, page, size },
      });
      return response.data;
    } catch (error) {
      console.error(`Ошибка поиска при запросе ${query}`, error);
      throw error;
    }
  },

  // 3. Поиск похожих на конкретную книгу (ID)
  findSimilarBooks: async (bookId, limit = 10) => {
    try {
      const response = await api.get(`/books/${bookId}/similar`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error(`Ошибка при поиске похожих для ID=${bookId}:`, error);
      return [];
    }
  },

  getBookContent: async (bookId) => {
    try {
      const response = await api.get(`/books/${bookId}/content`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка контента ${bookId}:`, error);
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },

  generateReadingMap: async (seedBookId, length = 5) => {
    try {
      const response = await api.get("/reading-maps/generate", {
        params: { seedBookId, length },
      });
      return response.data;
    } catch (error) {
      console.error("Ошибка генерации карты:", error);
      throw error;
    }
  },

  // 4. Рекомендации по тегу (добавил page/size для пагинации)
  getRecommendationsByTag: async (tag, page = 0, size = 20) => {
    try {
      const response = await api.get("/recommendations/by-tag", {
        params: { tag, page, size },
      });
      return response.data;
    } catch (error) {
      console.error("Ошибка рекомендаций по тегу", error);
      throw error;
    }
  },

  getUserTags: async () => {
    try {
      const response = await api.get("/recommendations/tags");
      return response.data;
    } catch (error) {
      console.error("Ошибка получения тегов", error);
      return [];
    }
  },
};
