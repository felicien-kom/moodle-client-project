// src/routes/auth.routes.js
import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import * as auth from "../controllers/auth.controller.js";

const router = Router();

// ── Routes publiques (pas de token local requis) ─────────────

// GET  /api/auth/profiles   → liste tous les profils locaux (pour l'écran de sélection)
router.get("/profiles", auth.listProfiles);

// POST /api/auth/profile    → créer un profil local (internet + compte Moodle requis)
router.post("/profiles", auth.createProfile);

// POST /api/auth/login      → connexion locale (fonctionne hors ligne)
router.post("/login", auth.login);

// ── Routes protégées (JWT local requis) ──────────────────────

// GET  /api/auth/me                   → profil courant
router.get("/me", authenticate, auth.getMe);

// PATCH /api/auth/me                  → mise à jour du profil (hors ligne OK)
router.patch("/me", authenticate, auth.updateMe);

// POST /api/auth/server-token/refresh → renouveler le token Moodle (internet requis)
router.post("/server-token/refresh", authenticate, auth.refreshMoodleToken);

// DELETE /api/auth/profile            → supprimer le profil local
// router.delete("/me", authenticate, auth.deleteProfile);

export default router;