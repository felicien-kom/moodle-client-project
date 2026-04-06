// src/config/db.js
// Pattern identique à ecom-client : new PrismaLibSql({ url }) directement.
//
// Règle URL libsql sur Windows :
//   Accepté  : "file:C:/Users/.../data/master.db"   (chemin absolu, slashes avant)
//   Refusé   : "file:///C:/..."                      (triple slash → double lettre de lecteur)
//   Refusé   : chemins avec espaces encodés %20      (décoder avant usage)
//
// On construit l'URL ainsi :
//   "file:" + path.resolve(...).replace(/\\/g, "/")
// path.resolve() donne le chemin absolu natif, on remplace les \ par / pour libsql.

import path from "path";
import fs from "fs";
import { PrismaLibSql } from "@prisma/adapter-libsql";

import { PrismaClient as MasterPrismaClient } from "../../prisma/master/generated/index.js";
import { PrismaClient as UserPrismaClient }   from "../../prisma/user/generated/index.js";

import { env } from "./env.js";

// ─── URL absolue compatible libsql + Windows ─────────────────
// "file:" + chemin absolu avec slashes avant (pas de triple slash)
// Aucun encodage URL — les espaces restent des espaces (libsql les gère)

const toLibsqlUrl = (filePath) => {
  // filePath peut être un chemin absolu ou relatif
  const abs = path.resolve(filePath); // toujours absolu
  const normalized = abs.replace(/\\/g, "/"); // \ → / pour Windows
  return `file:${normalized}`; // "file:C:/Users/..." ou "file:/home/..."
};

// ─── Helpers de création ─────────────────────────────────────

const createMasterClient = () => {
  const dbPath = path.resolve(env.DATABASE_DIR, "master.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const url     = toLibsqlUrl(dbPath);
  const adapter = new PrismaLibSql({ url });
  return new MasterPrismaClient({ adapter });
};

const createUserClient = (dbRelativePath) => {
  // dbRelativePath : "data/alice_universite_fr.db" (relatif, stocké en base)
  const dbPath = path.resolve(dbRelativePath);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const url     = toLibsqlUrl(dbPath);
  const adapter = new PrismaLibSql({ url });
  return new UserPrismaClient({ adapter });
};

// ─── Base master — singleton lazy ────────────────────────────

let _masterInstance = null;

const getMasterInstance = () => {
  if (!_masterInstance) _masterInstance = createMasterClient();
  return _masterInstance;
};

export const masterDb = new Proxy(
  {},
  { get(_, prop) { return getMasterInstance()[prop]; } }
);

// ─── Base user — cache par email ─────────────────────────────

const userClients = new Map();

/**
 * Retourne le client Prisma pour la base d'un utilisateur.
 *
 * @param {string} email        - clé du cache
 * @param {string} [dbRelPath]  - chemin RELATIF de la base (ex: "data/alice.db")
 *                                Si absent, calculé depuis l'email.
 */
export const getDb = (email, dbRelPath) => {
  if (userClients.has(email)) return userClients.get(email);

  const resolvedRelPath = dbRelPath ?? buildDbRelPath(email);
  const client = createUserClient(resolvedRelPath);
  userClients.set(email, client);

  return client;
};

/**
 * Construit le chemin RELATIF de la base utilisateur.
 * Toujours relatif à la racine du projet : "data/alice_universite_fr.db"
 * C'est cette valeur qui est stockée dans master.db (jamais le chemin absolu).
 */
export const buildDbRelPath = (email) => {
  const safeEmail = email.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return path.join("data", `${safeEmail}.db`).replace(/\\/g, "/");
};

/**
 * Déconnecte tous les clients — appelé à l'arrêt du serveur.
 */
export const disconnectAll = async () => {
  if (_masterInstance) {
    await _masterInstance.$disconnect();
    _masterInstance = null;
  }
  for (const client of userClients.values()) {
    await client.$disconnect();
  }
  userClients.clear();
};