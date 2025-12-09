// src/services/tagService.js

import api from "./api";

export const tagService = {
  getAllUserTags: async () => {
    try {
      const response = await api.get("/tags");
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении тегов пользователя:", error);
      throw error;
    }
  },

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
