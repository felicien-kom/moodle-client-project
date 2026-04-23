// src/middlewares/authenticate.js
// Vérifie le JWT local et injecte :
//   req.user   → payload décodé { id, email, username, role }
//   req.prisma → client Prisma pour la base de CET utilisateur
//
// req.prisma est la clé de l'architecture multi-profils :
// chaque requête authentifiée travaille automatiquement sur la bonne base SQLite.

import { verifyJwt } from "../utils/jwt.js";
import { getDb } from "../config/db.js";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyJwt(token);
    req.user = payload;
    // Charge (ou récupère du cache) le client Prisma de cet utilisateur
    req.prisma = getDb(payload.email);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};