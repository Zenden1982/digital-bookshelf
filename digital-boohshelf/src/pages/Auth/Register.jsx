import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { validators } from "../../utils/validators";
import "./Auth.css";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (apiError) {
      setApiError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validators.validateRegisterForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      await register(formData);
      navigate("/login", {
        state: {
          message: "Регистрация прошла успешно. Пожалуйста, войдите в систему.",
        },
      });
    } catch (error) {
      setApiError(
        error.message || "Ошибка регистрации. Пожалуйста, попробуйте снова."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Регистрация</h1>
        <p className="auth-subtitle">Создайте аккаунт в Цифровой полке</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {apiError && <div className="error-message">{apiError}</div>}

          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? "input-error" : ""}
              placeholder="Введите имя пользователя"
              disabled={loading}
            />
            {errors.username && (
              <span className="field-error">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "input-error" : ""}
              placeholder="Введите email"
              disabled={loading}
            />
            {errors.email && (
              <span className="field-error">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "input-error" : ""}
              placeholder="Введите пароль"
              disabled={loading}
            />
            {errors.password && (
              <span className="field-error">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? "input-error" : ""}
              placeholder="Подтвердите пароль"
              disabled={loading}
            />
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="auth-footer">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="auth-link">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
