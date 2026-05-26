// src/validators/assignment.validator.js

export const validateSaveDraft = ({ id, text }) => {
  const errors = [];

  // Validation de l'ID (doit être un entier positif)
  const parsedId = Number(id);
  if (!id || Number.isNaN(parsedId) || !Number.isInteger(parsedId) || parsedId <= 0) {
    errors.push("L'ID du devoir est invalide ou manquant.");
  }

  // Validation du texte (s'il est présent, ça doit être une string)
  if (text !== undefined && text !== null && typeof text !== "string") {
    errors.push("Le texte de soumission doit être une chaîne de caractères.");
  }

  return { errors, parsedId };
};

export const validateSubmitAssignment = ({ id }) => {
  const errors = [];

  // Validation de l'ID
  const parsedId = Number(id);
  if (!id || Number.isNaN(parsedId) || !Number.isInteger(parsedId) || parsedId <= 0) {
    errors.push("L'ID du devoir est invalide ou manquant.");
  }

  return { errors, parsedId };
};