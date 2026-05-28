// src/validators/calendar.validator.js

export const validateEvent = ({ name, timeStart, timeDuration, courseId }) => {
  const errors = [];

  if (!name || typeof name !== "string" || !name.trim()) {
    errors.push("Le nom de l'événement est requis.");
  }

  const parsedStart = Number(timeStart);
  if (timeStart === undefined || Number.isNaN(parsedStart)) {
    errors.push("La date de début (timeStart) est requise et doit être un timestamp valide.");
  }

  const parsedDuration = timeDuration !== undefined ? Number(timeDuration) : 0;
  if (Number.isNaN(parsedDuration)) {
    errors.push("La durée (timeDuration) doit être un nombre.");
  }

  const parsedCourseId = courseId !== undefined ? Number(courseId) : null;
  if (courseId !== undefined && Number.isNaN(parsedCourseId)) {
    errors.push("L'ID du cours (courseId) doit être un nombre valide.");
  }

  return { errors, parsedStart, parsedDuration, parsedCourseId };
};