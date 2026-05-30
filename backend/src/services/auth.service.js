// src/services/auth.service.js
// Ordre dans createProfile (important) :
//   1. Vérifier unicité en base locale (rapide, sans réseau)
//   2. Valider credentials sur Moodle (réseau)
//   3. Appliquer migrations sur la nouvelle base user (filesystem)
//   4. Créer entrée dans master.db
//   5. Créer LocalUser dans la base user
//   6. Retourner JWT
//
// master.db stocke le chemin RELATIF de la base user (ex: "data/alice.db")
// jamais le chemin absolu — portable entre machines et OS.

import bcrypt from "bcrypt";
import { masterDb, getDb, buildDbRelPath } from "../config/db.js";
import { signJwt } from "../utils/jwt.js";
import { getMoodleToken, moodleFetch, checkMoodleReachable as checkMoodleApiReachable } from "../config/moodleApi.js";
import { migrateUserDb } from "../scripts/migrate-user.js";

const BCRYPT_ROUNDS = 12;

// ─── createProfile ───────────────────────────────────────────

export const createProfile = async ({ email, username, serverPassword, clientPassword }) => {

  // 1. Vérifier unicité AVANT tout appel réseau
  const existing = await masterDb.profile.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    const field = existing.email === email ? email : username;
    const err = new Error(`A local profile already exists for '${field}'. Use login instead.`);
    err.statusCode = 409;
    throw err;
  }

  // 2. Valider credentials sur Moodle → obtenir token
  const moodleToken = await getMoodleToken(username, serverPassword);

  // 3. Récupérer infos utilisateur depuis Moodle (valide aussi le token)
  const { data: siteInfo } = await moodleFetch(
    "core_webservice_get_site_info",
    {},
    moodleToken
  );

  // ─── NOUVEAU : 3b. Détection Intelligente du Rôle ─────────────
  let detectedRole = "STUDENT"; // Étudiant par défaut
  
  try {
    const { data: courses } = await moodleFetch(
      "core_enrol_get_users_courses",
      { userid: siteInfo.userid },
      moodleToken
    );

    if (Array.isArray(courses) && courses.length > 0) {
      for (const course of courses) {
        try {
          // On tente d'obtenir les détails des inscrits sur ce cours
          const { data: enrolledUsers } = await moodleFetch(
            "core_enrol_get_enrolled_users",
            { courseid: course.id },
            moodleToken
          );

          // On cherche notre utilisateur dans la liste
          const meInCourse = enrolledUsers?.find(u => u.id === siteInfo.userid);
          
          if (meInCourse && Array.isArray(meInCourse.roles)) {
            const isTeacher = meInCourse.roles.some(r => 
              r.shortname === "editingteacher" || 
              r.shortname === "teacher" || 
              r.shortname === "manager"
            );
            
            if (isTeacher) {
              detectedRole = "TEACHER";
              break; // On a trouvé un cours où il est prof, on arrête la boucle
            }
          }
        } catch (e) {
          // Si Moodle refuse l'accès (capacité insuffisante), c'est qu'il est 
          // fort probablement juste étudiant sur CE cours. On ignore et on continue.
          continue; 
        }
      }
    }
  } catch (error) {
    // Si la récupération des cours plante, on reste en STUDENT par défaut.
    console.warn("[AUTH] Impossible de récupérer les cours pour détection du rôle", error.message);
  }
  // ─────────────────────────────────────────────────────────────

  // 4. Préparer le chemin RELATIF de la base user
  const dbRelPath = buildDbRelPath(email);

  // 5. Appliquer les migrations sur la nouvelle base user
  migrateUserDb(dbRelPath);

  // 6. Enregistrer dans master.db (registre des profils)
  await masterDb.profile.create({
    data: {
      email,
      username,
      name:      siteInfo.fullname,
      role:      detectedRole,       // <-- AJUSTEMENT ICI
      dbPath:    dbRelPath,          
    },
  });

  // 7. Créer LocalUser dans la base dédiée
  const userPrisma = getDb(email, dbRelPath);
  const clientPasswordHash = await bcrypt.hash(clientPassword, BCRYPT_ROUNDS);

  const localUser = await userPrisma.localUser.create({
    data: {
      email,
      username,
      name:               siteInfo.fullname,
      role:               detectedRole,      // <-- AJUSTEMENT ICI
      clientPasswordHash,
      moodleToken,
      moodleUserId:       siteInfo.userid,
      server_id:          siteInfo.userid,
      sync_status:        "SYNCED",
    },
  });

  return {
    token: signJwt({
      id:       localUser.id,
      email:    localUser.email,
      username: localUser.username,
      role:     localUser.role, // Le JWT contiendra automatiquement "TEACHER" ou "STUDENT"
    }),
    user: _safeUser(localUser),
  };
};

// ─── login ───────────────────────────────────────────────────

export const login = async ({ username, clientPassword }) => {
  const profile = await masterDb.profile.findFirst({
    where: { OR: [{ username }, { email: username }] },
  });

  if (!profile) {
    const err = new Error("No local profile found. Create a profile first.");
    err.statusCode = 401;
    throw err;
  }

  const userPrisma = getDb(profile.email, profile.dbPath);
  const localUser  = await userPrisma.localUser.findFirst();

  if (!localUser) {
    const err = new Error("Local profile corrupted. Please recreate your profile.");
    err.statusCode = 500;
    throw err;
  }

  const valid = await bcrypt.compare(clientPassword, localUser.clientPasswordHash);
  if (!valid) {
    const err = new Error("Invalid client password");
    err.statusCode = 401;
    throw err;
  }

  await masterDb.profile.update({
    where: { email: profile.email },
    data:  { lastLoginAt: new Date() },
  });

  return {
    token: signJwt({
      id:       localUser.id,
      email:    localUser.email,
      username: localUser.username,
      role:     localUser.role,
    }),
    user: _safeUser(localUser),
  };
};

// ─── getMe ───────────────────────────────────────────────────

export const getMe = async (prisma) => {
  const user = await prisma.localUser.findFirst();
  if (!user) {
    const err = new Error("Local user not found");
    err.statusCode = 404;
    throw err;
  }
  return _safeUser(user);
};

// ─── updateMe ────────────────────────────────────────────────

export const updateMe = async (prisma, { name }) => {
  const user = await prisma.localUser.findFirst();
  if (!user) {
    const err = new Error("Local user not found");
    err.statusCode = 404;
    throw err;
  }

  const updated = await prisma.localUser.update({
    where: { id: user.id },
    data: {
      ...(name && { name: name.trim() }),
      sync_status: "PENDING_PUSH",
    },
  });

  return _safeUser(updated);
};

// ─── refreshMoodleToken ──────────────────────────────────────

export const refreshMoodleToken = async (prisma, { serverPassword }) => {
  const user = await prisma.localUser.findFirst();
  if (!user) {
    const err = new Error("Local user not found");
    err.statusCode = 404;
    throw err;
  }

  const newToken = await getMoodleToken(user.username, serverPassword);
  await prisma.localUser.update({
    where: { id: user.id },
    data:  { moodleToken: newToken },
  });

  return { message: "Moodle token refreshed successfully" };
};

// ─── listProfiles ────────────────────────────────────────────

export const listProfiles = async () => {
  return masterDb.profile.findMany({
    orderBy: { lastLoginAt: "desc" },
    select: {
      id:          true,
      email:       true,
      username:    true,
      name:        true,
      role:        true,
      createdAt:   true,
      lastLoginAt: true,
    },
  });
};

// ─── checkMoodleReachable ─────────────────────────────────────

export const checkMoodleReachable = async () => {
  return await checkMoodleApiReachable();
};

// ─── Helper ──────────────────────────────────────────────────

const _safeUser = (user) => ({
  id:           user.id,
  email:        user.email,
  username:     user.username,
  name:         user.name,
  role:         user.role,
  moodleUserId: user.moodleUserId,
  syncStatus:   user.sync_status,
  createdAt:    user.createdAt,
});