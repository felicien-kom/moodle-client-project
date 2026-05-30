// src/controllers/auth.controller.js
// Express 5 — les erreurs async se propagent automatiquement vers errorHandler
// Pas de try/catch ici — laisser les erreurs remonter

import * as authService from "../services/auth.service.js";
import {
  validateCreateProfile,
  validateLogin,
  validateUpdateMe,
  validateRefreshToken,
} from "../validators/auth.validator.js";

// POST /api/auth/profile — Création de profil (internet requis)
export const createProfile = async (req, res) => {
  const { email, username, serverPassword, clientPassword } = req.body;

  const { errors } = validateCreateProfile({ email, username, serverPassword, clientPassword });
  if (errors.length) return res.status(400).json({ errors });

  const result = await authService.createProfile({ email, username, serverPassword, clientPassword });
  res.status(201).json(result);
};

// POST /api/auth/login — Connexion locale (fonctionne hors ligne)
export const login = async (req, res) => {
  const { username: userUsername, email: userEmail, clientPassword } = req.body;

  const { errors } = validateLogin({ username: userUsername, email: userEmail, clientPassword });
  if (errors.length) return res.status(400).json({ errors });

  const username = userUsername ?? userEmail;
  // console.log(`Username or email : ${usernameOrEmail}`);

  const result = await authService.login({ username, clientPassword });
  res.json(result);
};

// GET /api/auth/me — Profil de l'utilisateur connecté
export const getMe = async (req, res) => {
  const user = await authService.getMe(req.prisma);
  res.json({ user });
};

// PATCH /api/auth/me — Mise à jour du profil (hors ligne OK, sync au prochain run)
export const updateMe = async (req, res) => {
  const { name } = req.body;

  const { errors } = validateUpdateMe({ name });
  if (errors.length) return res.status(400).json({ errors });

  const user = await authService.updateMe(req.prisma, { name });
  res.json({ user });
};

// POST /api/auth/server-token/refresh — Renouvelle le token Moodle (internet requis)
export const refreshMoodleToken = async (req, res) => {
  const { serverPassword } = req.body;

  const { errors } = validateRefreshToken({ serverPassword });
  if (errors.length) return res.status(400).json({ errors });

  const result = await authService.refreshMoodleToken(req.prisma, { serverPassword });
  res.json(result);
};

// GET /api/auth/profiles — Liste tous les profils locaux
export const listProfiles = async (req, res) => {
  const profiles = await authService.listProfiles();
  res.json({ profiles });
};

// GET /api/auth/moodle-status — Vérifie si le serveur Moodle est joignable
export const getMoodleStatus = async (req, res) => {
  const isReachable = await authService.checkMoodleReachable();
  res.json({ reachable: isReachable });
};

// DELETE /api/auth/profile — Supprime le profil local de l'utilisateur connecté
// export const deleteProfile = async (req, res) => {
//   const result = await authService.deleteProfile(req.user.email);
//   res.json(result);
// };