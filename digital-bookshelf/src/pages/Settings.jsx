// src/pages/Settings.jsx

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";

import CameraAltIcon from "@mui/icons-material/CameraAlt";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import SaveIcon from "@mui/icons-material/Save";

import "./Settings.css";

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || "",
        email: user.email || "",
      });
      if (user.avatarUrl) {
        setAvatarPreview(user.avatarUrl);
      }
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({
          text: "Файл слишком большой (макс. 5 МБ)",
          type: "error",
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await userService.updateProfile(user.id, {
        username: profileData.username,
        email: profileData.email,
        password: user.password,
      });

      const updatedUser = { ...user, ...response };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      if (refreshUser) {
        await refreshUser();
      }

      setMessage({ text: "Профиль успешно обновлен", type: "success" });
    } catch (error) {
      console.error("Полная ошибка:", error);
      setMessage({
        text: error.response?.data?.message || "Ошибка обновления профиля",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ text: "Пароли не совпадают", type: "error" });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({
        text: "Пароль должен быть не менее 6 символов",
        type: "error",
      });
      setLoading(false);
      return;
    }

    try {
      await userService.updatePassword(passwordData);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage({ text: "Пароль успешно изменен", type: "success" });
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Ошибка изменения пароля",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSubmit = async (e) => {
    e.preventDefault();
    if (!avatarFile) {
      setMessage({ text: "Выберите изображение", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      await userService.uploadAvatar(avatarFile);

      if (refreshUser) {
        await refreshUser();
      }

      setAvatarFile(null);
      setMessage({ text: "Аватар успешно обновлен", type: "success" });
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Ошибка загрузки аватара",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Настройки профиля</h1>

        {message.text && (
          <div className={`settings-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="settings-content">
          <section className="settings-section avatar-section">
            <h2 className="section-title">
              <CameraAltIcon /> Фотография профиля
            </h2>
            <form onSubmit={handleAvatarSubmit} className="avatar-form">
              <div className="avatar-preview-container">
                <img
                  src={
                    avatarPreview ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${
                      user?.username || "U"
                    }`
                  }
                  alt="Аватар"
                  className="avatar-preview"
                />
                <label className="avatar-upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    hidden
                  />
                  <CameraAltIcon />
                  Изменить фото
                </label>
              </div>
              {avatarFile && (
                <button type="submit" className="btn-save" disabled={loading}>
                  <SaveIcon /> Сохранить фото
                </button>
              )}
            </form>
          </section>

          <section className="settings-section">
            <h2 className="section-title">
              <PersonIcon /> Основная информация
            </h2>
            <form onSubmit={handleProfileSubmit} className="settings-form">
              <div className="form-group">
                <label htmlFor="username">Имя пользователя</label>
                <div className="input-with-icon">
                  <PersonIcon className="input-icon" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileChange}
                    minLength={2}
                    maxLength={30}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-with-icon">
                  <EmailIcon className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-save" disabled={loading}>
                <SaveIcon /> Сохранить изменения
              </button>
            </form>
          </section>

          <section className="settings-section">
            <h2 className="section-title">
              <LockIcon /> Изменить пароль
            </h2>
            <form onSubmit={handlePasswordSubmit} className="settings-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Текущий пароль</label>
                <div className="input-with-icon">
                  <LockIcon className="input-icon" />
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">Новый пароль</label>
                <div className="input-with-icon">
                  <LockIcon className="input-icon" />
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Подтвердите пароль</label>
                <div className="input-with-icon">
                  <LockIcon className="input-icon" />
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-save" disabled={loading}>
                <SaveIcon /> Изменить пароль
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
