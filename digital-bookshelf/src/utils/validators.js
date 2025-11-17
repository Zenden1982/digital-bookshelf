export const validators = {
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPassword: (password) => {
    return password && password.length >= 6;
  },

  isValidUsername: (username) => {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(username);
  },

  isNotEmpty: (value) => {
    return value && value.trim().length > 0;
  },

  validateRegisterForm: (FormData) => {
    const errors = {};

    if (!validators.isNotEmpty(FormData.username)) {
      errors.username = "Имя пользователя обязательно.";
    } else if (!validators.isValidUsername(FormData.username)) {
      errors.username =
        "Имя пользователя должно быть от 3 до 20 символов и содержать только буквы, цифры, подчеркивания или дефисы.";
    }

    if (!validators.isNotEmpty(FormData.email)) {
      errors.email = "Email обязателен.";
    } else if (!validators.isValidEmail(FormData.email)) {
      errors.email = "Некорректный формат email.";
    }

    if (!validators.isNotEmpty(FormData.password)) {
      errors.password = "Пароль обязателен.";
    } else if (!validators.isValidPassword(FormData.password)) {
      errors.password = "Пароль должен быть не менее 6 символов.";
    }

    if (FormData.password !== FormData.confirmPassword) {
      errors.confirmPassword = "Пароли не совпадают.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  validateLoginForm: (FormData) => {
    const errors = {};

    if (!validators.isNotEmpty(FormData.username)) {
      errors.username = "Имя пользователя обязательно.";
    }

    if (!validators.isNotEmpty(FormData.password)) {
      errors.password = "Пароль обязателен.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};
