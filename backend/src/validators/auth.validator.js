// src/validators/auth.validator.js
// Validation vanilla JS — pas de dépendance externe (Zod, Joi...)
// Chaque fonction retourne { errors: string[] }

export const validateCreateProfile = ({ email, username, serverPassword, clientPassword }) => {
  const errors = [];

  if (!email?.trim()) {
    errors.push("email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push("email must be a valid email address");
  }

  if (!username?.trim()) errors.push("username is required");
  if (!serverPassword) errors.push("serverPassword is required");

  if (!clientPassword) {
    errors.push("clientPassword is required");
  } else if (clientPassword.length < 8) {
    errors.push("clientPassword must be at least 8 characters");
  }

  return { errors };
};

export const validateLogin = ({ username, clientPassword }) => {
  const errors = [];
  if (!username?.trim()) errors.push("username (or email) is required");
  if (!clientPassword) errors.push("clientPassword is required");
  return { errors };
};

export const validateUpdateMe = ({ name }) => {
  const errors = [];
  if (name !== undefined && !name?.trim()) errors.push("name cannot be empty");
  return { errors };
};

export const validateRefreshToken = ({ serverPassword }) => {
  const errors = [];
  if (!serverPassword) errors.push("serverPassword is required");
  return { errors };
};