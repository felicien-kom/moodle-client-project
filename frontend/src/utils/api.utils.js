import { API_CONFIG } from "@/config/api.config";

const { storage } = API_CONFIG;

// --- Gestion des tokens ---

export function getAccessToken() {
  return localStorage.getItem(storage.accessToken);
}

export function getRefreshToken() {
  return localStorage.getItem(storage.refreshToken);
}

export function setTokens({ accessToken, refreshToken }) {
  localStorage.setItem(storage.accessToken,  accessToken);
  localStorage.setItem(storage.refreshToken, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(storage.accessToken);
  localStorage.removeItem(storage.refreshToken);
}

// --- Construction des headers ---

/**
 * @param {boolean} withAuth - Si false, n'ajoute pas le header Authorization
 */
export function buildHeaders(withAuth = true) {
  const headers = { ...API_CONFIG.headers };

  if (withAuth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// --- Normalisation des erreurs ---

/**
 * Transforme n'importe quelle erreur en objet structuré cohérent.
 * Tous les appelants reçoivent toujours la même forme d'erreur.
 */
export function normalizeError(error) {
  // Erreur HTTP structurée (venant de apiClient)
  if (error?.isApiError) return error;

  // Timeout ou abort
  if (error?.name === "AbortError") {
    return { isApiError: true, status: 408, message: "La requête a expiré.", data: null };
  }

  // Réseau inaccessible
  if (!navigator.onLine || error?.message === "Failed to fetch") {
    return { isApiError: true, status: 0, message: "Pas de connexion réseau.", data: null };
  }

  // Fallback générique
  return {
    isApiError: true,
    status:     error?.status  ?? null,
    message:    error?.message ?? "Une erreur inattendue est survenue.",
    data:       null,
  };
}