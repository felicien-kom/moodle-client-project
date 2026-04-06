// src/scripts/migrate-user.js
// Applique les migrations du schéma user sur une base SQLite nouvellement créée.
// Appelé par createProfile() avant toute écriture en base.
//
// Utilise "prisma migrate deploy" :
//   - Applique les migrations existantes dans prisma/user/migrations/
//   - Ne crée pas de nouvelle migration (contrairement à migrate dev)
//   - Ne pose pas de questions interactives
//
// cross-env n'est pas utilisé ici — on passe les variables via env: {} de execSync,
// ce qui fonctionne sur tous les OS sans passer par le shell.

import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../.."); // racine du projet

/**
 * Applique les migrations user sur une nouvelle base SQLite.
 *
 * @param {string} dbRelPath - chemin RELATIF de la base : "data/alice_universite_fr.db"
 *                             Relatif à la racine du projet.
 * @throws {Error} si la migration échoue
 */
export const migrateUserDb = (dbRelPath) => {
  // Résoudre en chemin absolu pour execSync
  const dbAbsPath = path.resolve(ROOT, dbRelPath);

  // Créer le dossier data/ si nécessaire (sans URL, juste le chemin FS)
  const dbDir = path.dirname(dbAbsPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // URL libsql pour Prisma : "file:" + chemin absolu avec slashes avant
  const dbUrl = "file:" + dbAbsPath.replace(/\\/g, "/");

  try {
    execSync("npx prisma migrate deploy", {
      cwd: ROOT,
      env: {
        ...process.env,
        PRISMA_TARGET:         "user",
        USER_MIGRATION_DB_URL: dbUrl,
      },
      stdio: "pipe",
    });
  } catch (err) {
    const stderr = err.stderr?.toString() ?? "";
    const stdout = err.stdout?.toString() ?? "";
    throw new Error(
      `Migration failed for ${path.basename(dbRelPath)}:\n${stderr || stdout || err.message}`
    );
  }
};