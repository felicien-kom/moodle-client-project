// src/config/moodleApi.js
// Couche d'abstraction entre le moteur de sync et l'API Moodle Web Services.
//
// RÈGLE : tout appel vers Moodle passe par moodleFetch() — jamais de fetch() direct ailleurs.
//
// Particularités Moodle :
//   1. Un seul endpoint universel : POST /webservice/rest/server.php
//   2. Les erreurs sont en HTTP 200 avec body { exception, errorcode, message }
//      "exception" contient le namespace PHP : "core\\exception\\moodle_exception"
//   3. L'heure serveur fiable est dans le header HTTP "Date" de chaque réponse (UTC)
//   4. Les paramètres tableaux sont en bracket notation : ids[0]=5&ids[1]=12

import { env } from "./env.js";

const CONTENT_TIMEOUT = 15000;
const AUTH_TIMEOUT = 10000;
const CHECK_TIMEOUT = 5000;

// ─── Classe d'erreur Moodle ──────────────────────────────────

export class MoodleApiError extends Error {
  constructor(errorcode, message) {
    super(message);
    this.errorcode = errorcode;
    this.name = "MoodleApiError";
  }
}

const TOKEN_ERROR_CODES = ["invalidtoken", "requireloginerror", "tokenexpired"];

export const isMoodleTokenError = (err) =>
  err instanceof MoodleApiError && TOKEN_ERROR_CODES.includes(err.errorcode);

// ─── Servertime depuis le header HTTP Date ───────────────────
// Le header "Date" de chaque réponse Moodle est en UTC (GMT+0).
// C'est la seule source fiable pour le curseur de sync.
// Format reçu : "Sat, 04 Apr 2026 07:12:56 GMT"
// Retourne un Unix timestamp entier en secondes.

export const parseServertime = (response) => {
  const dateHeader = response.headers.get("Date");
  if (!dateHeader) return Math.floor(Date.now() / 1000);
  return Math.floor(new Date(dateHeader).getTime() / 1000);
};

// ─── Sérialisation bracket notation ─────────────────────────
// Moodle attend les tableaux et objets en bracket notation dans URLSearchParams

export const flattenParams = (obj, prefix = "") => {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === "object" && item !== null) {
          Object.assign(result, flattenParams(item, `${fullKey}[${i}]`));
        } else {
          result[`${fullKey}[${i}]`] = String(item);
        }
      });
    } else if (typeof value === "object") {
      Object.assign(result, flattenParams(value, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
};

// ─── Appel principal ─────────────────────────────────────────
// URL du serveur Moodle = env.MOODLE_URL — fixe pour toute l'instance, jamais en paramètre.
//
// Retourne { data, servertime } :
//   data       → corps JSON de la réponse Moodle
//   servertime → Unix timestamp UTC extrait du header "Date"

export const moodleFetch = async (wsfunction, params = {}, token) => {
  const url = `${env.MOODLE_URL}/webservice/rest/server.php`;

  const body = new URLSearchParams({
    wstoken: token,
    wsfunction,
    moodlewsrestformat: "json",
    ...flattenParams(params),
  });

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(CONTENT_TIMEOUT),
    });
  } catch (err) {
    const networkErr = new Error(`Moodle server unreachable: ${err.message}`);
    networkErr.isNetworkError = true;
    throw networkErr;
  }

  // Extraire servertime depuis le header AVANT de lire le body (stream consommé une seule fois)
  const servertime = parseServertime(response);

  if (!response.ok) {
    throw new MoodleApiError("http_error", `HTTP ${response.status} from Moodle server`);
  }

  const data = await response.json();

  // Moodle signale les erreurs dans le body en HTTP 200
  // Le champ "exception" contient le namespace PHP complet
  if (data?.exception) {
    throw new MoodleApiError(
      data.errorcode ?? "unknown_error",
      data.message ?? "Unknown Moodle error"
    );
  }

  return { data, servertime };
};

// ─── Authentification ────────────────────────────────────────
// env.MOODLE_URL et env.MOODLE_SERVICE sont fixes — pas de paramètre URL ici

export const getMoodleToken = async (username, serverPassword) => {
  const url = new URL(`${env.MOODLE_URL}/login/token.php`);
  url.searchParams.set("username", username);
  url.searchParams.set("password", serverPassword);
  url.searchParams.set("service", env.MOODLE_SERVICE);

  let response;
  try {
    response = await fetch(url.toString(), { signal: AbortSignal.timeout(AUTH_TIMEOUT) });
  } catch (err) {
    const networkErr = new Error(`Cannot reach Moodle server: ${err.message}`);
    networkErr.isNetworkError = true;
    throw networkErr;
  }

  const data = await response.json();

  if (data.error) {
    throw new MoodleApiError(data.errorcode ?? "invalidlogin", data.error);
  }
  if (!data.token) {
    throw new MoodleApiError("no_token", "Moodle did not return a token");
  }

  return data.token;
};

// ─── Connectivité ────────────────────────────────────────────

export const checkMoodleReachable = async () => {
  try {
    await fetch(`${env.MOODLE_URL}/webservice/rest/server.php?moodlewsrestformat=json`, {
      signal: AbortSignal.timeout(CHECK_TIMEOUT),
    });
    return true;
  } catch {
    return false;
  }
};