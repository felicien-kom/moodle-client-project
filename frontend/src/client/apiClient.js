import { API_CONFIG } from "@/config/api.config";
import { buildHeaders, clearToken, normalizeError } from "@/utils/api.utils";

/**
 * @param {string}  endpoint
 * @param {Object}  options
 * @param {string}  [options.method="GET"]
 * @param {Object}  [options.body]
 * @param {Object}  [options.params]       - Query params
 * @param {boolean} [options.withAuth=true] - false pour les routes publiques
 */
async function request(endpoint, {
  method   = "GET",
  body     = null,
  params   = null,
  withAuth = true,
} = {}) {

  const url = new URL(`${API_CONFIG.baseURL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, value);
    });
  }

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

    // 401 : token invalide ou expiré → on déconnecte proprement
    if (response.status === 401 && withAuth) {
      clearToken();
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
      throw { isApiError: true, status: 401, message: "Session expirée. Veuillez vous reconnecter.", data: null };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw {
        isApiError: true,
        status:     response.status,
        message:    errorData?.message ?? errorData?.detail ?? `Erreur ${response.status}`,
        data:       errorData,
      };
    }

    if (response.status === 204) return null;

    return await response.json();

  } catch (error) {
    clearTimeout(timeoutId);
    throw normalizeError(error);
  }
}

const apiClient = {
  get:    (endpoint, options = {}) => request(endpoint, { ...options, method: "GET"    }),
  post:   (endpoint, options = {}) => request(endpoint, { ...options, method: "POST"   }),
  put:    (endpoint, options = {}) => request(endpoint, { ...options, method: "PUT"    }),
  patch:  (endpoint, options = {}) => request(endpoint, { ...options, method: "PATCH"  }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: "DELETE" }),
};

export default apiClient;