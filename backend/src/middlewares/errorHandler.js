// src/middlewares/errorHandler.js
// Handler global d'erreurs — Express 5 propage les erreurs async automatiquement
// Ce handler est le dernier middleware monté dans app.js

import { MoodleApiError, isMoodleTokenError } from "../config/moodleApi.js";

export const errorHandler = (err, req, res, next) => {  // eslint-disable-line no-unused-vars
  // Erreur JWT (token local invalide ou expiré)
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Token Moodle expiré détecté pendant une opération
  if (isMoodleTokenError(err)) {
    return res.status(401).json({
      error: "Moodle token expired or invalid. Please refresh your server token.",
      errorcode: err.errorcode,
    });
  }

  // Erreur Moodle générique (droits insuffisants, fonction inconnue...)
  if (err instanceof MoodleApiError) {
    return res.status(502).json({
      error: `Moodle error: ${err.message}`,
      errorcode: err.errorcode,
    });
  }

  // Erreur réseau (serveur Moodle inaccessible)
  if (err.isNetworkError) {
    return res.status(503).json({ error: err.message });
  }

  // Erreur métier avec statusCode explicite
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Erreur inconnue
  if (process.env.NODE_ENV !== "production") {
    console.error("[ErrorHandler]", err);
  }

  return res.status(500).json({ error: "Internal server error" });
};