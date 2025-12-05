// src/components/layout/Header.jsx

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { userService } from "../../services/userService";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PersonIcon from "@mui/icons-material/Person";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";

import "./Header.css";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const [searchMode, setSearchMode] = useState("regular");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const mode = searchMode === "semantic" ? "semantic" : "regular";
      navigate(
        `/search?q=${encodeURIComponent(searchQuery.trim())}&mode=${mode}`
      );
    }
  };

  const toggleSearchMode = () => {
    setSearchMode((prev) => (prev === "regular" ? "semantic" : "regular"));
  };

  const getAvatarSrc = () => {
    if (user?.avatarUrl) {
      if (
        user.avatarUrl.startsWith("http") ||
        user.avatarUrl.startsWith("data:")
      ) {
        return user.avatarUrl;
      }
      return userService.getAvatarUrl(user.avatarUrl);
    }
    return `https://api.dicebear.com/7.x/initials/svg?seed=${
      user?.username || "U"
    }`;
  };

  const placeholder =
    searchMode === "semantic"
      ? "Поиск по смыслу: 'книги о любви', 'детективы в Париже'..."
      : "Поиск по названию, автору...";

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
            <button
              type="button"
              className={`search-mode-toggle ${searchMode}`}
              onClick={toggleSearchMode}
              aria-label="Переключить режим поиска"
              title={
                searchMode === "regular"
                  ? "Переключить на семантический поиск"
                  : "Переключить на обычный поиск"
              }
            >
              {searchMode === "regular" ? (
                <MenuBookIcon sx={{ fontSize: 20 }} />
              ) : (
                <PsychologyIcon sx={{ fontSize: 20 }} />
              )}
            </button>

            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />

            <button type="submit" aria-label="Искать" className="search-submit">
              <SearchIcon />
            </button>
          </form>

          <div className="user-profile-menu">
            <img src={getAvatarSrc()} alt="Аватар" className="user-avatar" />
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
