// src/pages/Admin/BookEditor.jsx

import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import "./BookEditor.css";

import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";

const BookEditor = ({ bookId, onClose, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    publishedDate: "",
    pageCount: "",
    annotation: "",
    coverUrl: "",
    genres: "", // Только жанры
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookId) {
      setFormData({
        title: "",
        author: "",
        isbn: "",
        publishedDate: "",
        pageCount: "",
        annotation: "",
        coverUrl: "",
        genres: "",
      });
      return;
    }

    setLoading(true);
    adminService
      .getBookForEdit(bookId)
      .then((response) => {
        const data = response.book ? response.book : response;

        let formattedDate = "";
        if (data.publishedDate) {
          formattedDate = data.publishedDate.split("T")[0];
        }

        // Преобразуем массив жанров в строку
        const genresStr = data.genres ? data.genres.join(", ") : "";

        setFormData({
          title: data.title || "",
          author: data.author || "",
          isbn: data.isbn || "",
          publishedDate: formattedDate,
          pageCount: data.pageCount || "",
          annotation: data.annotation || "",
          coverUrl: data.coverUrl || "",
          genres: genresStr,
        });
      })
      .catch((err) => {
        console.error(err);
        setError("Не удалось загрузить данные книги");
      })
      .finally(() => setLoading(false));
  }, [bookId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Преобразуем строку жанров обратно в массив
      const genresArray = formData.genres
        ? formData.genres
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : [];

      const payload = {
        ...formData,
        pageCount: formData.pageCount ? parseInt(formData.pageCount, 10) : null,
        publishedDate: formData.publishedDate
          ? `${formData.publishedDate}T00:00:00`
          : null,
        genres: genresArray, // Отправляем List<String>
      };

      if (bookId) {
        await adminService.updateBook(bookId, payload);
      } else {
        await adminService.createBook(payload);
      }

      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Ошибка при сохранении. Проверьте данные.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editor-overlay">
      <div className="editor-modal">
        <div className="editor-header">
          <h2>{bookId ? "Редактирование книги" : "Новая книга"}</h2>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {loading && bookId && !formData.title ? (
          <div style={{ padding: "20px", textAlign: "center" }}>
            Загрузка данных...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="editor-form">
            {error && <div className="editor-error">{error}</div>}

            <div className="form-group">
              <label>Название *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Автор *</label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ISBN</label>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Кол-во страниц</label>
                <input
                  type="number"
                  name="pageCount"
                  value={formData.pageCount}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Дата публикации</label>
              <input
                type="date"
                name="publishedDate"
                value={formData.publishedDate}
                onChange={handleChange}
              />
            </div>

            {/* Поле для Жанров */}
            <div className="form-group">
              <label>Жанры (через запятую)</label>
              <input
                type="text"
                name="genres"
                value={formData.genres}
                onChange={handleChange}
                placeholder="Фантастика, Роман, Драма"
              />
            </div>

            <div className="form-group">
              <label>URL обложки</label>
              <input
                type="url"
                name="coverUrl"
                value={formData.coverUrl}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
            {formData.coverUrl && (
              <div className="cover-preview">
                <img
                  src={formData.coverUrl}
                  alt="preview"
                  onError={(e) => (e.target.style.display = "none")}
                />
              </div>
            )}

            <div className="form-group">
              <label>Аннотация</label>
              <textarea
                name="annotation"
                value={formData.annotation}
                onChange={handleChange}
                rows="5"
              />
            </div>

            <div className="editor-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? (
                  "Сохранение..."
                ) : (
                  <>
                    <SaveIcon fontSize="small" /> Сохранить
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookEditor;
