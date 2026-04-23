// prisma.config.js
// Prisma 7 — un seul fichier de config pour deux schémas (master et user).
//
// Règle Prisma 7 :
//   - Le schéma (.prisma) NE doit PAS contenir d'url dans le datasource
//   - Le prisma.config.js DOIT fournir datasource.url pour les commandes migrate
//   - L'adapter libsql est utilisé à runtime (dans le code Node.js)
//   - Pour migrate dev/deploy, Prisma utilise datasource.url directement
//
// Sélection du schéma cible via PRISMA_TARGET :
//   PRISMA_TARGET=master (défaut) → schéma master, base master.db
//   PRISMA_TARGET=user            → schéma user, base définie par USER_MIGRATION_DB_URL

import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const DATABASE_DIR = path.resolve(process.env.DATABASE_DIR ?? "./data");
const TARGET       = process.env.PRISMA_TARGET ?? "master";
const isMaster     = TARGET !== "user";

const MASTER_DB_URL = `file:${path.join(DATABASE_DIR, "master.db")}`;

// Pour les migrations user via CLI : base template temporaire
// Pour migrateUserDb() appelé dans createProfile : base de l'utilisateur spécifique
const USER_MIGRATION_DB_URL =
  process.env.USER_MIGRATION_DB_URL ??
  `file:${path.join(DATABASE_DIR, "_migration_template.db")}`;

const activeUrl = isMaster ? MASTER_DB_URL : USER_MIGRATION_DB_URL;

export default defineConfig({
  schema: isMaster ? "prisma/master/schema.prisma" : "prisma/user/schema.prisma",
  migrations: {
    path: isMaster ? "prisma/master/migrations" : "prisma/user/migrations",
  },
  // datasource.url : requis par "prisma migrate dev/deploy"
  // C'est l'URL que le CLI Prisma utilise pour appliquer les migrations
  datasource: {
    url: activeUrl,
  },
  // adapter : utilisé à runtime par le code Node.js (pas par le CLI migrate)
  migrate: {
    adapter: () => new PrismaLibSql({ url: activeUrl }),
  },
});