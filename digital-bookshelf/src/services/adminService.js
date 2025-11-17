// src/services/adminService.js

import api from "./api"; // Наш настроенный axios-клиент

/**
 * Сервис для выполнения действий, требующих прав администратора.
 */
export const adminService = {
  /**
   * Сохраняет книгу из Google Books в локальную базу данных.
   * Хотя этот эндпоинт находится в BookController, логически это может быть
   * привилегированное действие (чтобы не засорять базу), поэтому выносим его сюда.
   *
   * Вызывает: POST /api/books/save-from-google/{googleBookId}
   *
   * @param {string} googleBookId - ID книги в Google Books (например, "abcdef12345").
   * @returns {Promise<BookReadDTO>} - Возвращает BookReadDTO сохраненной книги
   *   с новым ID из вашей базы данных.
   */
  addBookFromGoogle: async (googleBookId) => {
    try {
      if (!googleBookId) {
        throw new Error("googleBookId не может быть пустым");
      }

      // Делаем POST запрос. Тело запроса не требуется.
      const response = await api.post(
        `/books/save-from-google/${googleBookId}`
      );

      // Бэкенд возвращает BookReadDTO созданной книги
      return response.data;
    } catch (error) {
      console.error("Ошибка при сохранении книги из Google Books:", error);
      // Пробрасываем ошибку для обработки в UI
      throw error;
    }
  },

  // В будущем здесь будут другие админские функции:
  // createBookManually: async (bookData) => { ... },
  // deleteUser: async (userId) => { ... },
  // и т.д.
};
