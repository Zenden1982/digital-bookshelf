// src/components/layout/Header.jsx

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";

import "./Header.css";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Перенаправляем на страницу результатов поиска с запросом в URL
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Проверяем, является ли пользователь админом
  const isAdmin = authService.hasRole("ROLE_ADMIN");

  return (
    <header className="app-header">
      <div className="header-container">
        <NavLink to="/" className="header-logo">
          <span className="logo-text">Цифровая полка</span>
        </NavLink>

        <nav className="header-nav">
          <NavLink to="/">Главная</NavLink>
          <NavLink to="/my-catalog">Мой Каталог</NavLink>
          <NavLink to="/map">Карта чтения</NavLink>
          <NavLink to="/analytics">Аналитика</NavLink>

          {isAdmin && (
            <NavLink to="/admin" className="admin-link">
              <AdminPanelSettingsIcon
                sx={{ fontSize: 18, marginRight: "4px" }}
              />
              Админ-панель
            </NavLink>
          )}
        </nav>

        <div className="header-actions">
          <form onSubmit={handleSearch} className="search-bar">
            <input
              type="text"
              placeholder="Поиск по названию, автору..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" aria-label="Искать">
              <SearchIcon />
            </button>
          </form>

          <div className="user-profile-menu">
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${
                user?.username || "U"
              }`}
              alt="Аватар"
              className="user-avatar"
            />
            <div className="dropdown-menu">
              <div className="dropdown-user-info">
                <strong>{user?.username}</strong>
                <span>{user?.email}</span>
              </div>
              <NavLink to="/profile">
                <PersonIcon /> Профиль
              </NavLink>
              <NavLink to="/settings">
                <SettingsIcon /> Настройки
              </NavLink>
              <button onClick={logout}>
                <LogoutIcon /> Выйти
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
