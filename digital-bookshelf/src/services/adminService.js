// src/services/adminService.js

import api from "./api";

export const adminService = {
  /**
   * Получает список всех книг для админки (с пагинацией и сортировкой).
   * Вызывает: GET /api/books/search (или специальный админский эндпоинт, если есть)
   */
  getAllBooks: async (params) => {
    // params: { page, size, sort, query }
    try {
      // Используем существующий поиск, так как он возвращает Page<Book>
      const response = await api.get("/books/search", { params });
      return response.data;
    } catch (error) {
      console.error("Ошибка при загрузке списка книг:", error);
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
      const response = await api.put(`/admin/books/${id}`, bookData);
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

  /**
   * Получает полную информацию о книге для редактирования
   * (можно использовать bookService.getBookDetail, но для админки лучше чистый метод)
   */
  getBookForEdit: async (id) => {
    try {
      const response = await api.get(`/books/${id}`);
      return response.data; // Тут вернется DTO, возможно BookDetailDTO
    } catch (error) {
      console.error(`Ошибка получения книги ${id}`, error);
      throw error;
    }
  },
};
