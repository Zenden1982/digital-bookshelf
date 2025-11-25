// src/services/shelfService.js

import api from "./api"; // Наш настроенный axios-клиент

/**
 * Сервис для работы с личной книжной полкой пользователя (API /api/shelf)
 */
export const shelfService = {
  /**
   * Получает книги с полки текущего пользователя с возможностью фильтрации, сортировки и поиска.
   * Вызывает: GET /api/shelf
   *
   * @param {object} params - Объект с параметрами запроса.
   * @param {number} [params.page=0] - Номер страницы.
   * @param {number} [params.size=20] - Количество элементов на странице.
   * @param {string} [params.query] - Поисковый запрос по названию или автору.
   * @param {string[]} [params.status] - Массив статусов для фильтрации (['READING', 'READ']).
   * @param {string} [params.sort] - Строка сортировки (например, 'book.title,asc').
   * @returns {Promise<Page<UserBookReadDTO>>} - Объект страницы с книгами пользователя.
   */
  getMyShelf: async (params = {}) => {
    try {
      // Axios умеет корректно сериализовывать массив в параметры URL
      // (например, status=READING&status=READ), что Spring понимает по умолчанию.
      const response = await api.get("/shelf", { params });
      return response.data;
    } catch (error) {
      console.error("Ошибка при загрузке полки пользователя:", error);
      throw error;
    }
  },

  /**
   * Добавляет книгу на свою полку.
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
   * Обновляет статус, прогресс или рейтинг книги на своей полке.
   * Вызывает: PATCH /api/shelf/{id}
   *
   * @param {number} userBookId - ID записи UserBook, которую нужно обновить.
   * @param {UserBookUpdateDTO} dto - Объект с обновляемыми полями { progress, status, rating, currentPage }.
   * @returns {Promise<UserBookReadDTO>} - Возвращает обновленную запись UserBook.
   */
  updateMyUserBook: async (userBookId, dto) => {
    try {
      const response = await api.put(`/shelf/${userBookId}`, dto);
      return response.data;
    } catch (error) {
      console.error(
        `Ошибка при обновлении книги ${userBookId} на полке:`,
        error
      );
      throw error;
    }
  },

  /**
   * Удаляет книгу со своей полки.
   * Вызывает: DELETE /api/shelf/{id}
   *
   * @param {number} userBookId - ID записи UserBook, которую нужно удалить.
   * @returns {Promise<void>} - Ничего не возвращает в случае успеха.
   */
  deleteMyUserBook: async (userBookId) => {
    try {
      await api.delete(`/shelf/${userBookId}`);
    } catch (error) {
      console.error(`Ошибка при удалении книги ${userBookId} с полки:`, error);
      throw error;
    }
  },

  /**
   * Загружает личный файл книги для записи на полке (создает приватную копию).
   * Вызывает: POST /api/v1/shelf/{userBookId}/content
   * @param {number} userBookId - ID записи UserBook
   * @param {File} file - Файл с текстом
   */
  uploadPersonalContent: async (userBookId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // ВАЖНО: Проверьте путь в вашем контроллере.
      // Вы прислали @RequestMapping("/api/v1/shelf") и метод @PostMapping("/{userBookId}/content")
      // Значит полный путь: /api/v1/shelf/{userBookId}/content
      const response = await api.post(
        `/shelf/${userBookId}/content`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Ошибка загрузки личного контента для userBook ${userBookId}:`,
        error
      );
      throw error;
    }
  },
};
