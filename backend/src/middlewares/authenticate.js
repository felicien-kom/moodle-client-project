// src/middlewares/authenticate.js
// Vérifie le JWT local et injecte dans req :
//   req.user        → payload { id, email, username, role }
//   req.prisma      → client Prisma pour la base de CET utilisateur
//   req.moodleToken → token Moodle pour les appels API online (null si non disponible)

import { verifyJwt } from "../utils/jwt.js";
import { getDb, masterDb } from "../config/db.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyJwt(token);
    req.user = payload;

    // Charger le profil depuis master pour obtenir dbPath
    const profile = await masterDb.profile.findUnique({ where: { email: payload.email } });
    if (!profile) {
      return res.status(401).json({ error: "Profile not found. Please recreate your profile." });
    }

    req.prisma = getDb(payload.email, profile.dbPath);

    // Injecter le token Moodle pour les routes qui en ont besoin (online)
    const localUser = await req.prisma.localUser.findFirst();
    req.moodleToken = localUser?.moodleToken ?? null;
    req.moodleUserId = localUser?.moodleUserId ?? null;

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};