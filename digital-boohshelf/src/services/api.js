import axios from "axios";
import { auth } from "../utils/auth";
import storage from "../utils/storage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token && !auth.isTokenExpired(token)) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      storage.clearAuth();
      window.location.href = "/login";
    }

    const errorMessage =
      error.response?.data?.message ||
      error.message?.data?.error ||
      error.message ||
      "Произошла ошибка";
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default apiClient;
