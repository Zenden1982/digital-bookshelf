import api from "./api";

export const userService = {
  updateProfile: async (userId, data) => {
    try {
      const response = await api.put(`/users/${userId}`, data);
      return response.data;
    } catch (error) {
      console.error("Ошибка обновления профиля:", error);
      throw error;
    }
  },

  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/users/avatar", formData);
      return response.data;
    } catch (error) {
      console.error("Ошибка загрузки аватара:", error);
      throw error;
    }
  },

  getAvatarUrl: (filename) => {
    if (!filename) return "";
    const cleanFilename = filename.split(/[/\\]/).pop();
    return `${api.defaults.baseURL}/users/avatar/${cleanFilename}`;
  },
};
