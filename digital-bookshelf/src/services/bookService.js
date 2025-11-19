// src/services/bookService.js

import api from "./api"; // Наш настроенный axios-клиент

/**
 * Сервис для работы с локальным каталогом книг (API /api/books)
 */
export const bookService = {
  /**
   * Выполняет поиск по локальной базе данных.
   * Вызывает: GET /api/books/search
   *
   * @param {string} query - Поисковый запрос.
   * @param {number} page - Номер страницы.
   * @param {number} size - Количество элементов на странице.
   * @returns {Promise<Page<BookReadDTO>>} - Объект страницы (Page) с результатами поиска.
   */
  searchLocal: async (query, page = 0, size = 20) => {
    try {
      if (!query || query.trim() === "") {
        // Если запрос пустой, возвращаем пустую страницу, чтобы не дергать бэкенд
        return { content: [], totalElements: 0, totalPages: 0, number: 0 };
      }

      const response = await api.get("/books/search", {
        params: {
          query,
          page,
          size,
        },
      });

      // Бэкенд возвращает стандартный объект Page<BookReadDTO>
      return response.data;
    } catch (error) {
      console.error("Ошибка при поиске по локальной базе:", error);
      throw error;
    }
  },

  /**
   * Получает детальную информацию о книге по её ID.
   * Вызывает: GET /api/books/{id}
   *
   * @param {number} bookId - ID книги.
   * @returns {Promise<BookReadDTO>} - DTO с детальной информацией о книге.
   */
  getBookById: async (bookId) => {
    try {
      const response = await api.get(`/books/${bookId}`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при получении книги с ID ${bookId}:`, error);
      throw error;
    }
  },

  /**
   * Получает все книги с пагинацией.
   * Вызывает: GET /api/books
   *
   * @param {number} page - Номер страницы.
   * @param {number} size - Количество элементов на странице.
   * @returns {Promise<Page<BookReadDTO>>} - Объект страницы (Page).
   */
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
      return response.data; // { book: {...}, userBook: {...} }
    } catch (error) {
      console.error(
        `Ошибка при получении детализации книги (ID=${bookId}):`,
        error
      );
      throw error;
    }
  },

  findSimilarBooksByQuery: async (query, topK = 5, page = 0, size = 5) => {
    try {
      const response = await api.get(`/books/similar`, {
        params: { query, topK, page, size },
      });
      return response.data;
    } catch {
      error;
    }
    {
      console.error(`Ошибка поиска при запросе ${query}`, query);
    }
  },

  findSimilarBooks: async (bookId, limit = 5) => {
    try {
      const response = await api.get(`/books/${bookId}/similar`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error(`Ошибка при поиске похожих книг для ID=${bookId}:`, error);
      return [];
    }
  },
};
