// src/services/aiService.js
import api from "./api";

export const aiService = {
  chat: async (payload) => {
    const res = await api.post("/ai/chat", payload);
    return res.data; // { answer }
  },
};
