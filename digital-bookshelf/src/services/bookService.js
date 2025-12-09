// src/services/bookService.js

import api from "./api";

export const bookService = {
  searchLocal: async (query, page = 0, size = 20) => {
    try {
      if (!query || query.trim() === "") {
        return { content: [], totalElements: 0, totalPages: 0, number: 0 };
      }

      const response = await api.get("/books/search", {
        params: {
          query,
          page,
          size,
        },
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
};
