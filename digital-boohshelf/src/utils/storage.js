const TOKEN_KEY = "digital-bookshelf-token";
const USER_KEY = "digital-bookshelf-user";

export const storage = {
  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },
  setUser: (user) => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },
  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  removeUser: () => {
    localStorage.removeItem(USER_KEY);
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  hasToken: () => {
    return !!localStorage.getItem(TOKEN_KEY); // !! преобразует в boolean
  },
};
export default storage;
