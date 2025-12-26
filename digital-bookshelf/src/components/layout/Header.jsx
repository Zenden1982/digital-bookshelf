import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { userService } from "../../services/userService";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CloseIcon from "@mui/icons-material/Close";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const mode = searchMode === "semantic" ? "semantic" : "regular";
      setMobileMenuOpen(false);
      navigate(
        `/search?q=${encodeURIComponent(searchQuery.trim())}&mode=${mode}`
      );
    }
  };

  const toggleSearchMode = () => {
    setSearchMode((prev) => (prev === "regular" ? "semantic" : "regular"));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
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
    searchMode === "semantic" ? "Поиск по смыслу..." : "Поиск...";

  const isAdmin = authService.hasRole("ROLE_ADMIN");

  return (
    <header className="app-header">
      <div className="header-container">
        <NavLink to="/" className="header-logo" onClick={closeMobileMenu}>
          <span className="logo-text">Цифровая полка</span>
        </NavLink>

        <nav className={`header-nav ${mobileMenuOpen ? "active" : ""}`}>
          <NavLink to="/" onClick={closeMobileMenu}>
            Главная
          </NavLink>
          <NavLink to="/my-catalog" onClick={closeMobileMenu}>
            Мой Каталог
          </NavLink>
          <NavLink to="/map" onClick={closeMobileMenu}>
            Карта чтения
          </NavLink>
          <NavLink to="/analytics" onClick={closeMobileMenu}>
            Аналитика
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin"
              className="admin-link"
              onClick={closeMobileMenu}
            >
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

          <button
            className="mobile-menu-btn"
            onClick={toggleMobileMenu}
            aria-label="Меню"
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
