// src/components/layout/Footer.jsx

import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <p>&copy; {currentYear} Цифровая полка. Все права защищены.</p>

        <div className="footer-links">
          <Link to="/about">О проекте</Link>
          <Link to="/privacy">Политика конфиденциальности</Link>
          <Link to="/support">Поддержка</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
