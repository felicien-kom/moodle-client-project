// src/utils/storage.js
import path from "path";
import fs from "fs";

/**
 * Reconstruit le nom de dossier sécurisé à partir de l'email (même logique que db.js)
 */
export const getSafeUserFolderName = (email) => {
  return email.replace(/[^a-z0-9]/gi, "_").toLowerCase();
};

/**
 * Retourne le chemin absolu du dossier média de l'utilisateur
 * Crée le dossier s'il n'existe pas encore.
 */
export const getUserMediaDir = (email) => {
  const userFolder = getSafeUserFolderName(email);
  const absPath = path.resolve("data", "media", userFolder);
  
  if (!fs.existsSync(absPath)) {
    fs.mkdirSync(absPath, { recursive: true });
  }
  return absPath;
};