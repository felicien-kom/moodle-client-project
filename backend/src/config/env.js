// src/config/env.js
import "dotenv/config";
import path from "path";

const DEVELOPMENT = "development";
const PRODUCTION = "production";
const TEST = "test";

const VALID_ENVS = [DEVELOPMENT, PRODUCTION, TEST];

if (!VALID_ENVS.includes(process.env.NODE_ENV)) {
  throw new Error(
    `Invalid NODE_ENV: "${process.env.NODE_ENV}". Must be one of: ${VALID_ENVS.join(", ")}`
  );
}

const required = ["NODE_ENV", "JWT_SECRET", "MOODLE_URL", "MOODLE_SERVICE", "HOST"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const RELATIVE_DATABASE_DIR = process.env.DATABASE_DIR ?? "./data";
const DATABASE_DIR = path.resolve(process.env.DATABASE_DIR ?? "./data");

export const env = {
  NODE_ENV: process.env.NODE_ENV,
  CLIENT_PORT: process.env.CLIENT_PORT ? Number(process.env.CLIENT_PORT) : 5000,
  // HOST="0.0.0.0" pour exposer sur le réseau (Docker, Electron, WiFi)
  // HOST non défini ou "false" → localhost uniquement
  HOST: process.env.HOST === "true",

  // Base master — registre des profils
  DATABASE_DIR,
  RELATIVE_DATABASE_DIR,
  MASTER_DB_URL: `file:${path.join(DATABASE_DIR, "master.db")}`,

  // Moodle — URL et service fixes pour toute l'instance
  // Configurés une fois dans .env, jamais stockés par profil
  MOODLE_URL:     process.env.MOODLE_URL.replace(/\/$/, ""), // retirer slash final
  MOODLE_SERVICE: process.env.MOODLE_SERVICE,

  // Auth locale
  JWT_SECRET:    process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1d",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : ["http://localhost", "http://127.0.0.1"],

  isDev:  process.env.NODE_ENV === DEVELOPMENT,
  isProd: process.env.NODE_ENV === PRODUCTION,
  isTest: process.env.NODE_ENV === TEST,
};