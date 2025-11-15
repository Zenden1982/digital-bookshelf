// src/services/shelfService.js

import api from "./api"; // Наш настроенный axios-клиент

/**
 * Сервис для работы с личной книжной полкой пользователя (API /api/shelf)
 */
export const shelfService = {
  /**
   * Получить книги с полки текущего пользователя.
   * Вызывает: GET /api/shelf
   *
   * @param {number} page - Номер страницы для пагинации (по умолчанию 0).
   * @param {number} size - Количество книг на странице (по умолчанию 100, чтобы загрузить побольше для полки).
   * @returns {Promise<Page<UserBookReadDTO>>} - Объект страницы, где `content` - это массив книг.
   */
  getMyShelf: async (page = 0, size = 100) => {
    try {
      // Делаем GET запрос с параметрами пагинации
      const response = await api.get("/shelf", {
        params: { page, size },
      });
      // Бэкенд возвращает объект Page, где книги лежат в поле "content"
      return response.data;
    } catch (error) {
      console.error("Ошибка при загрузке полки пользователя:", error);
      // Пробрасываем ошибку выше, чтобы компонент мог ее обработать
      throw error;
    }
  },

  /**
   * Добавить книгу на свою полку.
   * Вызывает: POST /api/shelf
   *
   * @param {UserBookCreateDTO} dto - Объект { bookId: number, status: string }.
   * @returns {Promise<UserBookReadDTO>} - Возвращает созданную запись UserBook.
   */
  addBookToMyShelf: async (dto) => {
    try {
      const response = await api.post("/shelf", dto);
      return response.data;
    } catch (error) {
      console.error("Ошибка при добавлении книги на полку:", error);
      throw error;
    }
  },

  /**
   * Обновить статус, прогресс или рейтинг книги на своей полке.
   * Вызывает: PATCH /api/shelf
   *
   * @param {UserBookUpdateDTO} dto - Объект { userBookId, progress, status, rating, currentPage }.
   * @returns {Promise<UserBookReadDTO>} - Возвращает обновленную запись UserBook.
   */
  updateMyUserBook: async (dto) => {
    try {
      // Используем PATCH, так как обновляем только часть данных
      const response = await api.patch("/shelf", dto);
      return response.data;
    } catch (error) {
      console.error("Ошибка при обновлении книги на полке:", error);
      throw error;
    }
  },

  /**
   * Удалить книгу со своей полки.
   * Вызывает: DELETE /api/shelf/{id}
   *
   * @param {number} userBookId - ID записи UserBook, которую нужно удалить.
   * @returns {Promise<void>} - Ничего не возвращает в случае успеха.
   */
  deleteMyUserBook: async (userBookId) => {
    try {
      // Делаем DELETE запрос на /shelf/123, где 123 - это userBookId
      await api.delete(`/shelf/${userBookId}`);
    } catch (error) {
      console.error("Ошибка при удалении книги с полки:", error);
      throw error;
    }
  },
};
