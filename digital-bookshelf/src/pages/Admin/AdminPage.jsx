import { useCallback, useEffect, useState } from "react";
import FileUploadModal from "../../components/common/FileUploadModal";
import Pagination from "../../components/common/Pagination";
import { adminService } from "../../services/adminService";
import "./AdminPage.css";
import BookEditor from "./BookEditor";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import SyncIcon from "@mui/icons-material/Sync";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const AdminPage = () => {
  const [books, setBooks] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadBookId, setUploadBookId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (query.trim()) {
        data = await adminService.searchBooks(query, page, 10);
      } else {
        data = await adminService.getAllBooks(page, 10);
      }

      setBooks(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error(error);
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
        fetchBooks();
      } catch (error) {
        alert("Ошибка при удалении книги");
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchBooks();
  };

  const handleCreate = () => {
    setEditingBookId(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (id) => {
    setEditingBookId(id);
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingBookId(null);
  };

  const handleSaveSuccess = () => {
    fetchBooks();
  };

  const handleUploadClick = (id) => {
    setUploadBookId(id);
    setIsUploadModalOpen(true);
  };

  const handleUploadClose = () => {
    setIsUploadModalOpen(false);
    setUploadBookId(null);
  };

  const handleUploadSuccess = () => {
    alert("Текст успешно загружен!");
  };

  const handleRegenerateEmbeddings = async () => {
    if (
      window.confirm(
        "Это может занять некоторое время. Вы уверены, что хотите перегенерировать векторы всех книг?"
      )
    ) {
      setIsRegenerating(true);
      try {
        const response = await adminService.regenerateEmbeddings();
        alert(response || "Векторы успешно перегенерированы!");
      } catch (error) {
        alert("Ошибка при перегенерации векторов");
        console.error(error);
      } finally {
        setIsRegenerating(false);
      }
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Управление библиотекой</h1>
        <div className="admin-header-actions">
          <button className="btn-primary add-book-btn" onClick={handleCreate}>
            <AddIcon /> Добавить книгу
          </button>
          <button
            className="btn-secondary regenerate-btn"
            onClick={handleRegenerateEmbeddings}
            disabled={isRegenerating}
            title="Перегенерировать векторы для всех книг"
          >
            <SyncIcon className={isRegenerating ? "spinning" : ""} />
            {isRegenerating ? " Перегенерация..." : " Перегенерировать векторы"}
          </button>
        </div>
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
                  <td className="actions-wrapper">
                    <button
                      className="btn-icon upload"
                      title="Загрузить текст"
                      onClick={() => handleUploadClick(book.id)}
                    >
                      <UploadFileIcon />
                    </button>
                    <button
                      className="btn-icon edit"
                      title="Редактировать"
                      onClick={() => handleEdit(book.id)}
                    >
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
          {isUploadModalOpen && (
            <FileUploadModal
              bookId={uploadBookId}
              onClose={handleUploadClose}
              onSuccess={handleUploadSuccess}
            />
          )}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {isEditorOpen && (
        <BookEditor
          bookId={editingBookId}
          onClose={handleEditorClose}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
};

export default AdminPage;
