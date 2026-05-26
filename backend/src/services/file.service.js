// src/services/file.service.js
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { getUserMediaDir, getUserSubmissionsDir } from "../utils/storage.js";

export const checkFileLocalStatus = (file, userEmail) => {
  if (!file.localPath) {
    return { ...file, isDownloaded: false };
  }

  // Astuce : getUserMediaDir pointe sur "data/media/email/"
  // Si localPath vaut "submissions/mon_fichier.pdf", path.join va 
  // naturellement résoudre vers "data/media/email/submissions/mon_fichier.pdf".
  // Donc cette fonction marche nativement pour les deux cas !
  const baseDir = getUserMediaDir(userEmail);
  const fullPath = path.join(baseDir, file.localPath);
  const exists = fs.existsSync(fullPath);

  return {
    ...file,
    isDownloaded: exists,
    localPath: exists ? file.localPath : null, 
  };
};

export const downloadSingleFile = async (prisma, fileId, userEmail, moodleToken) => {
  const file = await prisma.localFile.findUnique({ where: { id: fileId } });
  if (!file) {
    const err = new Error("File not found in local database metadata");
    err.statusCode = 404;
    throw err;
  }

  const baseDir = getUserMediaDir(userEmail);
  const safeName = file.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  
  // ─── L'INTELLIGENCE DU ROUTAGE EST ICI ───────────────────────
  let relativePath = "";
  
  if (file.submissionId) {
    // S'assurer que le dossier submissions existe (au cas où c'est un nouvel appareil)
    getUserSubmissionsDir(userEmail);
    // On force le chemin relatif dans le sous-dossier
    relativePath = path.join("submissions", `sub_${file.submissionId}_${file.id}_${safeName}`).replace(/\\/g, "/");
  } else {
    // Fichier classique du prof (cours)
    relativePath = `file_${file.id}_${safeName}`;
  }
  // ─────────────────────────────────────────────────────────────

  const fullPath = path.join(baseDir, relativePath);

  // GESTION DU DOUBLON : Si le fichier existe physiquement, on renvoie un statut spécifique
  if (fs.existsSync(fullPath)) {
    if (file.localPath !== relativePath) {
      await prisma.localFile.update({ where: { id: fileId }, data: { localPath: relativePath } });
    }
    return { 
      file: checkFileLocalStatus({ ...file, localPath: relativePath }, userEmail), 
      wasAlreadyDownloaded: true 
    };
  }

  if (!moodleToken) {
    const err = new Error("Token Moodle manquant. Impossible de télécharger.");
    err.statusCode = 401;
    throw err;
  }

  // Utilisation de votre excellente correction avec l'objet URL
  const urlObj = new URL(file.moodleUrl);
  urlObj.searchParams.delete('forcedownload');
  urlObj.searchParams.append('token', moodleToken);
  const authenticatedUrl = urlObj.toString();

  try {
    const response = await fetch(authenticatedUrl);
    if (!response.ok) {
      throw new Error(`Erreur serveur Moodle (HTTP ${response.status})`);
    }

    const fileStream = fs.createWriteStream(fullPath);
    await finished(Readable.fromWeb(response.body).pipe(fileStream));

    const updatedFile = await prisma.localFile.update({
      where: { id: fileId },
      data: { localPath: relativePath },
    });

    return { 
      file: checkFileLocalStatus(updatedFile, userEmail), 
      wasAlreadyDownloaded: false 
    };
  } catch (error) {
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath); 
    const netErr = new Error(`Échec du téléchargement : ${error.message}`);
    netErr.statusCode = 502;
    throw netErr;
  }
};