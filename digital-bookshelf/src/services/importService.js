// src/services/importService.js

import api from "./api";

export const importService = {
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
