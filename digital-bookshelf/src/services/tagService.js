// src/services/tagService.js

import api from "./api";

/**
 * Сервис для работы с тегами (API /api/v1/tags)
 */
export const tagService = {
  /**
   * Получает все теги текущего пользователя.
   */
  getAllUserTags: async () => {
    try {
      const response = await api.get("/tags");
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении тегов пользователя:", error);
      throw error;
    }
  },

  /**
   * Добавляет тег к книге на полке пользователя.
   * @param {number} userBookId - ID записи UserBook.
   * @param {string} tagName - Имя тега для добавления.
   */
  addTagToUserBook: async (userBookId, tagName) => {
    try {
      const payload = { tagName };
      const response = await api.post(`/tags/userbook/${userBookId}`, payload);
      return response.data;
    } catch (error) {
      console.error(
        `Ошибка при добавлении тега к userBookId ${userBookId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Удаляет тег с книги на полке пользователя.
   * @param {number} userBookId - ID записи UserBook.
   * @param {number} tagId - ID тега для удаления.
   */
  removeTagFromUserBook: async (userBookId, tagId) => {
    try {
      const response = await api.delete(
        `/tags/userbook/${userBookId}/tag/${tagId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Ошибка при удалении тега ${tagId} с userBookId ${userBookId}:`,
        error
      );
      throw error;
    }
  },
};
