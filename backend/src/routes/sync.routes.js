// src/routes/sync.routes.js
import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import * as sync from "../controllers/sync.controller.js";

const router = Router();

// Toutes les routes sync nécessitent un JWT local valide
router.use(authenticate);

router.post("/start",          sync.startSync); // Lancer une sync
router.get("/status",            sync.getSyncStatus); // Synchros en cours pour ce user
router.get("/logs",            sync.getSyncLogs); // Historique
router.get("/:id/progress",   sync.getSyncProgress); // Stream SSE

export default router;