// src/routes/file.routes.js
import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import * as fileController from "../controllers/file.controller.js";

const router = Router();

// Toutes les routes nécessitent l'authentification locale
router.use(authenticate);

// ── Bibliothèque globale ──────────────────────────────────────
router.get("/",                      fileController.getAllLocalFiles); // Optionnel : lister toute la bibliothèque

// ── Gestion Unitaire ──────────────────────────────────────────
router.get("/:fileId/serve",         fileController.serveFile);
router.post("/:fileId/download",     fileController.downloadFile);

// ── Gestion Multiple (Bulk) ───────────────────────────────────
router.post("/download-bulk",        fileController.bulkDownload);

export default router;