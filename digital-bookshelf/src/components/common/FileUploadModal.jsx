// src/components/common/FileUploadModal.jsx

import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useState } from "react";
import { adminService } from "../../services/adminService";
import { shelfService } from "../../services/shelfService";
import "./FileUploadModal.css"; // Стили ниже

const FileUploadModal = ({ bookId, userBookId, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Пожалуйста, выберите файл");
      return;
    }

    setLoading(true);
    try {
      if (userBookId) {
        // Режим пользователя: грузим в UserBook
        await shelfService.uploadPersonalContent(userBookId, file);
      } else if (bookId) {
        // Режим админа: грузим в Book
        await adminService.uploadBookContent(bookId, file);
      } else {
        throw new Error("Не указан ID для загрузки");
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      // Обновлен текст ошибки
      setError("Ошибка загрузки. Убедитесь, что формат файла поддерживается.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content upload-modal">
        <div className="modal-header">
          <h3>Загрузка текста книги</h3>
          <button onClick={onClose} className="close-btn">
            <CloseIcon />
          </button>
        </div>

        <div className="modal-body">
          {/* Обновлена подсказка */}
          <p className="upload-hint">
            Поддерживаются файлы: <b>.txt, .fb2, .epub</b>.
            {userBookId && " Книга будет сохранена как ваша личная копия."}
          </p>

          <label className={`file-drop-area ${file ? "has-file" : ""}`}>
            <input
              type="file"
              // Добавлены новые расширения и MIME-типы
              accept=".txt, .fb2, .epub, application/epub+zip, text/xml"
              onChange={handleFileChange}
              hidden
            />
            <CloudUploadIcon
              sx={{ fontSize: 48, color: file ? "#27ae60" : "#95a5a6" }}
            />
            <span className="file-name">
              {file ? file.name : "Нажмите, чтобы выбрать файл"}
            </span>
          </label>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Отмена
          </button>
          <button
            onClick={handleUpload}
            className="btn-primary"
            disabled={!file || loading}
          >
            {loading ? "Загрузка..." : "Загрузить"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
