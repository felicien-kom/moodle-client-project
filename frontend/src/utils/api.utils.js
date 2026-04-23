import { API_CONFIG } from "@/config/api.config";

const { storage } = API_CONFIG;

// --- Token unique ---

export function getToken() {
  return localStorage.getItem(storage.token);
}

export function setToken(token) {
  localStorage.setItem(storage.token, token);
}

export function clearToken() {
  localStorage.removeItem(storage.token);
}

export function getLocalUser() {
  return JSON.parse(localStorage.getItem(storage.moodleUser));
}

export function setLocalUser(localUser) {
  localStorage.setItem(storage.moodleUser, JSON.stringify(localUser));
}

export function clearLocalUser() {
  localStorage.removeItem(storage.moodleUser);
}

// --- Headers ---

/**
 * @param {boolean} withAuth - false pour les routes publiques (login, register)
 */
export function buildHeaders(withAuth = true) {
  const headers = { ...API_CONFIG.headers };

  if (withAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// --- Normalisation des erreurs ---

export function normalizeError(error) {
  if (error?.isApiError) return error;

  if (error?.name === "AbortError") {
    return { isApiError: true, status: 408, message: "La requête a expiré.", data: null };
  }

  if (!navigator.onLine || error?.message === "Failed to fetch") {
    return { isApiError: true, status: 0, message: "Pas de connexion réseau.", data: null };
  }

  return {
    isApiError: true,
    status:     error?.status  ?? null,
    message:    error?.message ?? "Une erreur inattendue est survenue.",
    data:       null,
  };
}