// src/services/bookService.js

import api from "./api"; // Наш настроенный axios-клиент

/**
 * Сервис для работы с глобальным каталогом книг (API /api/books)
 */
export const bookService = {
  /**
   * Выполняет комбинированный поиск по внутренней библиотеке и Google Books.
   * Вызывает: GET /api/books/search
   *
   * @param {string} query - Поисковый запрос (название, автор, ISBN и т.д.).
   * @param {number} maxResults - Максимальное количество результатов (по умолчанию 20).
   * @returns {Promise<BookSearchResultDTO>} - Объект с результатами поиска,
   *   содержащий списки myLibraryBooks и googleBooks.
   */
  searchBooks: async (query, maxResults = 20) => {
    try {
      // Предотвращаем отправку пустого запроса на бэкенд
      if (!query || query.trim() === "") {
        return {
          myLibraryBooks: [],
          googleBooks: [],
          query: "",
          totalMyBooks: 0,
          totalGoogleBooks: 0,
        };
      }

      // Делаем GET запрос, axios автоматически преобразует params в URL-параметры
      // /api/books/search?query=...&maxResults=...
      const response = await api.get("/books/search", {
        params: {
          query,
          maxResults,
        },
      });

      // Бэкенд возвращает готовый BookSearchResultDTO
      return response.data;
    } catch (error) {
      console.error("Ошибка при поиске книг:", error);
      throw error;
    }
  },

  /**
   * Сохраняет книгу из Google Books в локальную базу данных.
   * Эта функция вызывается, когда пользователь хочет добавить книгу, которой нет в нашей базе.
   * Вызывает: POST /api/books/save-from-google/{googleBookId}
   *
   * @param {string} googleBookId - ID книги в Google Books.
   * @returns {Promise<BookReadDTO>} - Возвращает BookReadDTO сохраненной книги
   *   с новым ID из нашей локальной базы данных.
   */
  saveFromGoogle: async (googleBookId) => {
    try {
      if (!googleBookId) {
        throw new Error("googleBookId не может быть пустым");
      }

      // Делаем POST-запрос. Тело запроса не нужно, т.к. ID передается в URL.
      const response = await api.post(
        `/books/save-from-google/${googleBookId}`
      );

      // Бэкенд возвращает BookReadDTO новой созданной книги
      return response.data;
    } catch (error) {
      console.error("Ошибка при сохранении книги из Google Books:", error);
      throw error;
    }
  },

  // Здесь в будущем можно будет добавить остальные функции для работы с книгами,
  // например, получение детальной информации о книге по ее ID.
  // getBookById: async (bookId) => { ... }
};
