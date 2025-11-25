// src/services/adminService.js

import api from "./api";

export const adminService = {
  /**
   * Получает список ВСЕХ книг (без фильтрации по названию).
   * Вызывает: GET /api/books (или /api/admin/books в зависимости от вашего контроллера)
   */
  getAllBooks: async (page = 0, size = 10) => {
    try {
      // ВАЖНО: Укажите здесь правильный путь к эндпоинту "getAllBooks"
      // Если он в BookController и доступен всем: /books
      // Если он в AdminController: /admin/books
      const response = await api.get("/books", {
        params: { page, size, sort: "id,desc" },
      });
      return response.data;
    } catch (error) {
      console.error("Ошибка при загрузке списка книг:", error);
      throw error;
    }
  },

  /**
   * Ищет книги по названию/автору.
   * Вызывает: GET /api/books/search
   */
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

  /**
   * Создает новую книгу.
   * Вызывает: POST /api/admin/books
   */
  createBook: async (bookData) => {
    try {
      const response = await api.post("/admin/books", bookData);
      return response.data;
    } catch (error) {
      console.error("Ошибка при создании книги:", error);
      throw error;
    }
  },

  /**
   * Обновляет существующую книгу.
   * Вызывает: PUT /api/admin/books/{id}
   */
  updateBook: async (id, bookData) => {
    try {
      const response = await api.put(`admin/import/books/${id}`, bookData);
      return response.data;
    } catch (error) {
      console.error(`Ошибка при обновлении книги ${id}:`, error);
      throw error;
    }
  },

  /**
   * Удаляет книгу.
   * Вызывает: DELETE /api/admin/books/{id}
   */
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

  /**
   * Загружает текстовый контент для книги (только для админа).
   * Вызывает: POST /api/v1/admin/books/{bookId}/content
   * @param {number} bookId
   * @param {File} file - Файл .txt (или .fb2, если бэкенд парсит)
   */
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
