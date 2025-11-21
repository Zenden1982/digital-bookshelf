// src/services/importService.js

import api from "./api"; // Наш настроенный axios-клиент

/**
 * Сервис для импорта книг из внешних источников (API /api/import)
 */
export const importService = {
  /**
   * Ищет книги в Google Books через наш бэкенд.
   * Вызывает: GET /api/admin/importsearch-google
   *
   * @param {string} query - Поисковый запрос.
   * @param {number} page - Номер страницы результатов.
   * @param {number} size - Количество результатов на странице.
   * @returns {Promise<Page<BookReadDTO>>} - Страница с результатами поиска в Google.
   */
  searchGoogle: async (query, page = 0, size = 10) => {
    try {
      if (!query || query.trim() === "") {
        return { content: [], totalElements: 0, totalPages: 0, number: 0 };
      }

      const response = await api.get("/admin/import/search-google", {
        params: { query, page, size },
      });
      return response.data;
    } catch (error) {
      console.error("Ошибка при поиске в Google Books:", error);
      throw error;
    }
  },

  /**
   * Поиск в Google Books ТОЛЬКО по названию.
   * Вызывает: GET /api/admin/import/search-by-title
   */
  searchGoogleByTitle: async (query, page = 0, size = 10) => {
    try {
      if (!query || query.trim() === "") {
        return { content: [], totalElements: 0, totalPages: 0, number: 0 };
      }

      const response = await api.get("/admin/import/search-by-title", {
        params: { query, page, size },
      });
      return response.data;
    } catch (error) {
      console.error(
        "Ошибка при поиске книги по названию в Google Books:",
        error
      );
      throw error;
    }
  },

  /**
   * Поиск в Google Books ТОЛЬКО по автору.
   * Вызывает: GET /api/admin/import/search-by-author
   */
  searchGoogleByAuthor: async (query, page = 0, size = 10) => {
    try {
      if (!query || query.trim() === "") {
        return { content: [], totalElements: 0, totalPages: 0, number: 0 };
      }

      const response = await api.get("/admin/import/search-by-author", {
        params: { query, page, size },
      });
      return response.data;
    } catch (error) {
      console.error("Ошибка при поиске книги по автору в Google Books:", error);
      throw error;
    }
  },
  /**
   * Импортирует книгу из Google Books в локальную базу данных по её Google ID.
   * Вызывает: POST /api/admin/importgoogle-book/{googleBookId}
   *
   * @param {string} googleBookId - ID книги в Google Books.
   * @returns {Promise<BookReadDTO>} - DTO книги, сохраненной в локальной базе (с новым локальным ID).
   */
  importByGoogleBookId: async (googleBookId) => {
    try {
      const response = await api.post(
        `/admin/import/google-book/${googleBookId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Ошибка при импорте книги с googleBookId ${googleBookId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Импортирует книгу в локальную базу данных по её ISBN.
   * Вызывает: POST /api/admin/importisbn/{isbn}
   *
   * @param {string} isbn - ISBN книги.
   * @returns {Promise<BookReadDTO>} - DTO книги, сохраненной в локальной базе (с новым локальным ID).
   */
  importByIsbn: async (isbn) => {
    try {
      const response = await api.post(`/admin/import/isbn/${isbn}`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при импорте книги с ISBN ${isbn}:`, error);
      throw error;
    }
  },
};
