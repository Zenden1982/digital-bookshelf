// src/services/shelfService.js

import api from "./api";

export const shelfService = {
  getMyShelf: async (params = {}) => {
    try {
      const response = await api.get("/shelf", { params });
      return response.data;
    } catch (error) {
      console.error("Ошибка при загрузке полки пользователя:", error);
      throw error;
    }
  },

  addBookToMyShelf: async (dto) => {
    try {
      const response = await api.post("/shelf", dto);
      return response.data;
    } catch (error) {
      console.error("Ошибка при добавлении книги на полку:", error);
      throw error;
    }
  },

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

  deleteMyUserBook: async (userBookId) => {
    try {
      await api.delete(`/shelf/${userBookId}`);
    } catch (error) {
      console.error(`Ошибка при удалении книги ${userBookId} с полки:`, error);
      throw error;
    }
  },

  uploadPersonalContent: async (userBookId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

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
