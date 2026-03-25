import { API_CONFIG } from "@/config/api.config";
import { refreshAccessToken } from "@/services/auth.service";
import { buildHeaders, clearTokens, normalizeError } from "@/utils/api.utils";

// --- État interne du client ---

// true pendant qu'un refresh est en cours → évite les refresh parallèles
let isRefreshing = false;

// File d'attente des requêtes en attente du nouveau token
// Chaque entrée est { resolve, reject }
let pendingQueue = [];

function processPendingQueue(error, newToken) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newToken);
  });
  pendingQueue = [];
}

// --- Fonction principale ---

/**
 * @param {string}  endpoint          - Chemin relatif ex: "/users/me"
 * @param {Object}  options
 * @param {string}  [options.method]  - GET, POST, PUT, PATCH, DELETE
 * @param {Object}  [options.body]    - Corps de la requête (sérialisé automatiquement)
 * @param {Object}  [options.params]  - Query params  ex: { page: 1, limit: 20 }
 * @param {boolean} [options.withAuth=true]  - false pour les routes publiques
 * @param {boolean} [options.isRetry=false]  - Usage interne uniquement (après refresh)
 */
async function request(endpoint, {
  method   = "GET",
  body     = null,
  params   = null,
  withAuth = true,       // ← l'option demandée : true par défaut, false pour exclure l'auth
  isRetry  = false,
} = {}) {

  // Construction de l'URL avec query params éventuels
  const url = new URL(`${API_CONFIG.baseURL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
  }

  // Timeout via AbortController
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: buildHeaders(withAuth),
      body:    body ? JSON.stringify(body) : null,
      signal:  controller.signal,
    });

    clearTimeout(timeoutId);

    // --- Cas 401 : access token expiré → tentative de refresh ---
    if (response.status === 401 && withAuth && !isRetry) {
      return handleTokenRefresh(endpoint, { method, body, params, withAuth });
    }

    // --- Réponse non-OK → erreur structurée ---
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw {
        isApiError: true,
        status:     response.status,
        message:    errorData?.message ?? `Erreur ${response.status}`,
        data:       errorData,
      };
    }

    // --- 204 No Content → pas de body ---
    if (response.status === 204) return null;

    return await response.json();

  } catch (error) {
    clearTimeout(timeoutId);
    throw normalizeError(error);
  }
}

// --- Gestion du refresh avec file d'attente ---

async function handleTokenRefresh(endpoint, options) {
  // Un refresh est déjà en cours → on met la requête en attente
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      pendingQueue.push({
        resolve: (newToken) => {
          // On relance la requête avec le nouveau token dès qu'il est disponible
          resolve(request(endpoint, { ...options, isRetry: true }));
        },
        reject,
      });
    });
  }

  // C'est cette requête qui lance le refresh
  isRefreshing = true;

  try {
    await refreshAccessToken();
    processPendingQueue(null);
    return request(endpoint, { ...options, isRetry: true });

  } catch (refreshError) {
    processPendingQueue(refreshError);
    clearTokens();

    // Événement global : les composants (ex: AuthContext) peuvent réagir
    window.dispatchEvent(new CustomEvent("auth:session-expired"));

    throw normalizeError(refreshError);

  } finally {
    isRefreshing = false;
  }
}

// --- API publique du client ---

const apiClient = {
  get:    (endpoint, options = {}) => request(endpoint, { ...options, method: "GET"    }),
  post:   (endpoint, options = {}) => request(endpoint, { ...options, method: "POST"   }),
  put:    (endpoint, options = {}) => request(endpoint, { ...options, method: "PUT"    }),
  patch:  (endpoint, options = {}) => request(endpoint, { ...options, method: "PATCH"  }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: "DELETE" }),
};

export default apiClient;