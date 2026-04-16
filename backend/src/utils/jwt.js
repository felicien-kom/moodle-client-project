// src/utils/jwt.js
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Génère un JWT local pour une session client (pas le token Moodle).
 * Contient : id, email, username, role — tout ce dont les middlewares ont besoin.
 *
 * @param {{ id: number, email: string, username: string, role: string }} payload
 * @returns {string}
 */
export const signJwt = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

/**
 * Vérifie et décode un JWT local.
 * Lève une erreur si invalide ou expiré — propagée par Express 5.
 *
 * @param {string} token
 * @returns {{ id: number, email: string, username: string, role: string }}
 */
export const verifyJwt = (token) => jwt.verify(token, env.JWT_SECRET);