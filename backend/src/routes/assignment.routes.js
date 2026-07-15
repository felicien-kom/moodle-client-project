// src/routes/assignment.routes.js
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middlewares/authenticate.js";
import * as assignController from "../controllers/assignment.controller.js";

const router = Router();
router.use(authenticate);

// Configuration Multer : On stocke temporairement en mémoire, le service gérera l'écriture physique
const upload = multer({ storage: multer.memoryStorage() });

// PUT : Sauvegarder un brouillon (Texte et/ou Fichiers)
router.put("/:id/draft", upload.array("files", 10), assignController.saveDraft);

// POST : Verrouiller et soumettre
router.post("/:id/submit", assignController.submitAssignment);

export default router;