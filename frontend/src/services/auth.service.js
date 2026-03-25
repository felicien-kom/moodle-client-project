import { API_CONFIG } from "@/config/api.config";
import { clearTokens, getRefreshToken, setTokens } from "@/utils/api.utils";

/**
 * Tente de renouveler l'access token via le refresh token.
 * Appel fetch natif : ne passe PAS par apiClient (évite la récursion infinie).
 *
 * @returns {Promise<string>} Le nouvel access token
 * @throws  Si le refresh échoue (token expiré, révoqué, réseau KO)
 */
export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearTokens();
    throw new Error("Aucun refresh token disponible.");
  }

  const response = await fetch(
    `${API_CONFIG.baseURL}${API_CONFIG.endpoints.refresh}`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ "refresh_token": refreshToken }),
    }
  );

  if (!response.ok) {
    clearTokens();
    throw new Error("Session expirée ou refutée. Veuillez vous reconnecter.");
  }

  const data = await response.json();

  // Adapte les clés à la réponse réelle de ton API
  setTokens({
    accessToken:  data["access_token"],
    refreshToken: data["refresh_token"] ?? refreshToken, // rotation optionnelle
  });

  return data["access_token"];
}