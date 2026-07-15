// src/controllers/file.controller.js
import path from "path";
import fs from "fs";
import * as fileService from "../services/file.service.js";
import { getUserMediaDir } from "../utils/storage.js";

export const getAllLocalFiles = async (req, res) => {
  const files = await req.prisma.localFile.findMany({ orderBy: { filename: "asc" } });
  const enrichedFiles = files.map(f => fileService.checkFileLocalStatus(f, req.user.email));
  res.json({ files: enrichedFiles });
};

// GET /api/v1/files/:fileId/serve
export const serveFile = async (req, res) => {
  const fileId = Number(req.params.fileId);
  const { email } = req.user;

  const file = await req.prisma.localFile.findUnique({ where: { id: fileId } });
  if (!file) {
    return res.status(404).json({ error: "Métadonnées du fichier introuvables", code: "NOT_FOUND" });
  }

  const status = fileService.checkFileLocalStatus(file, email);

  // STRICT SRP : Si absent, on s'arrête là. C'est au front de lancer le download.
  if (!status.isDownloaded) {
    return res.status(404).json({ 
      error: "Fichier non disponible hors-ligne. Veuillez le télécharger.", 
      code: "NOT_DOWNLOADED" 
    });
  }

  const baseDir = getUserMediaDir(email);
  const fullPath = path.join(baseDir, status.localPath);

  res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
  // "inline" essaie d'afficher dans le navigateur (ex: PDF), "attachment" force le téléchargement
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.filename)}"`);
  
  fs.createReadStream(fullPath).pipe(res);
};

// POST /api/v1/files/:fileId/download
export const downloadFile = async (req, res) => {
  const fileId = Number(req.params.fileId);
  const { email } = req.user;

  const { file, wasAlreadyDownloaded } = await fileService.downloadSingleFile(req.prisma, fileId, email, req.moodleToken);
  
  const statusHttp = wasAlreadyDownloaded ? 200 : 201;
  const message = wasAlreadyDownloaded ? "Fichier déjà présent localement" : "Téléchargement réussi";

  res.status(statusHttp).json({ message, file });
};

// POST /api/v1/files/download-bulk
export const bulkDownload = async (req, res) => {
  const { fileIds } = req.body; 
  const { email } = req.user;

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ error: "Le tableau fileIds est requis et ne peut être vide" });
  }

  const results = { success: [], errors: [] };

  for (const id of fileIds) {
    try {
      const { file } = await fileService.downloadSingleFile(req.prisma, id, email, req.moodleToken);
      results.success.push({ id, filename: file.filename });
    } catch (err) {
      results.errors.push({ id, error: err.message });
    }
  }

  const statusCode = results.errors.length === 0 ? 200 : 207; // 207 Multi-Status
  res.status(statusCode).json(results);
};