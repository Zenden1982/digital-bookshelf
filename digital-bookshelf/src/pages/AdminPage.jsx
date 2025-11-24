// src/pages/Admin/AdminPage.jsx

import { useCallback, useEffect, useState } from "react";
import Pagination from "../../components/common/Pagination"; // Переиспользуем нашу пагинацию
import { adminService } from "../../services/adminService";
import "./AdminPage.css"; // Создадим стили позже

// Иконки
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";

const AdminPage = () => {
  const [books, setBooks] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getAllBooks({
        page,
        size: 10,
        query,
        sort: "id,desc", // Новые книги сверху
      });
      setBooks(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      alert("Не удалось загрузить список книг");
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Вы действительно хотите удалить эту книгу? Это действие необратимо."
      )
    ) {
      try {
        await adminService.deleteBook(id);
        fetchBooks(); // Перезагружаем таблицу
      } catch (error) {
        alert("Ошибка при удалении книги");
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0); // Сброс на первую страницу при поиске
    fetchBooks();
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Управление библиотекой</h1>
        <button className="btn-primary add-book-btn">
          <AddIcon /> Добавить книгу
        </button>
      </header>

      <div className="admin-toolbar">
        <form onSubmit={handleSearch} className="admin-search">
          <input
            type="text"
            placeholder="Поиск по названию или автору..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">
            <SearchIcon />
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loader">Загрузка...</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Обложка</th>
                <th>Название</th>
                <th>Автор</th>
                <th>Год</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td>{book.id}</td>
                  <td>
                    <img
                      src={book.coverUrl || "https://via.placeholder.com/50"}
                      alt="cover"
                      className="table-cover"
                    />
                  </td>
                  <td className="fw-bold">{book.title}</td>
                  <td>{book.author}</td>
                  <td>
                    {book.publishedDate
                      ? book.publishedDate.split("-")[0]
                      : "-"}
                  </td>
                  <td className="actions-cell">
                    <button className="btn-icon edit" title="Редактировать">
                      <EditIcon />
                    </button>
                    <button
                      className="btn-icon delete"
                      title="Удалить"
                      onClick={() => handleDelete(book.id)}
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export default AdminPage;
