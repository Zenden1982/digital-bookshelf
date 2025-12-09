// src/services/adminService.js

import api from "./api";

export const adminService = {
  getAllBooks: async (page = 0, size = 10) => {
    try {
      const response = await api.get("/books", {
        params: { page, size, sort: "id,desc" },
      });
      return response.data;
    } catch (error) {
      console.error("Ошибка при загрузке списка книг:", error);
      throw error;
    }
  },

  searchBooks: async (query, page = 0, size = 10) => {
    try {
      const response = await api.get("/books/search", {
        params: { query, page, size },
      });
      return response.data;
    } catch (error) {
      console.error("Ошибка при поиске книг:", error);
      throw error;
    }
  },

  createBook: async (bookData) => {
    try {
      const response = await api.post("/admin/books", bookData);
      return response.data;
    } catch (error) {
      console.error("Ошибка при создании книги:", error);
      throw error;
    }
  },

  updateBook: async (id, bookData) => {
    try {
      const response = await api.put(`admin/import/books/${id}`, bookData);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при обновлении книги ${id}:`, error);
      throw error;
    }
  },

  deleteBook: async (id) => {
    try {
      await api.delete(`/admin/books/${id}`);
    } catch (error) {
      console.error(`Ошибка при удалении книги ${id}:`, error);
      throw error;
    }
  },

  getBookForEdit: async (id) => {
    try {
      const response = await api.get(`/books/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Ошибка получения книги ${id}`, error);
      throw error;
    }
  },

  uploadBookContent: async (bookId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        `/admin/books/${bookId}/content`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Ошибка загрузки контента для книги ${bookId}:`, error);
      throw error;
    }
  },
};
