import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "@/client/apiClient";
import { clearToken, getToken, setLocalUser, setToken } from "@/utils/api.utils";
import { API_CONFIG } from "@/config/api.config";
import { PATHS } from "@/router/paths";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = user !== null;

  // --- Vérification initiale : token en storage → récupérer le profil ---
  useEffect(() => {
    const token = getToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    apiClient
      .get(API_CONFIG.endpoints.me)
      .then(setUser)
      .catch(() => {
        // clearToken();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // --- Session expirée émise par apiClient (401) ---
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      navigate(PATHS.auth.login, { replace: true });
    };

    window.addEventListener("auth:session-expired", handleExpired);
    return () => window.removeEventListener("auth:session-expired", handleExpired);
  }, [navigate]);

  // --- Login ---
  const login = useCallback(async ({ email, password }) => {
    const data = await apiClient.post(API_CONFIG.endpoints.login, {
      body:     { email, clientPassword: password },
      withAuth: false,
    });

    // Adaptez selon ce que renvoie votre backend :
    // { access: "...", user: {...} }  ou  { token: "...", user: {...} }
    const token = data.token ?? data.access;
    if (!token) throw { isApiError: true, status: 500, message: "Token absent dans la réponse.", data };

    setToken(token);

    // Si le backend renvoie le profil dans la réponse de login, on l'utilise directement.
    // Sinon on le récupère via /auth/me.
    const profile = data.user ?? await apiClient.get(API_CONFIG.endpoints.me);
    setUser(profile);
    setLocalUser(profile);

    return profile;
  }, []);

  // --- Logout ---
  const logout = useCallback(async () => {
    // try {
    //   await apiClient.post(API_CONFIG.endpoints.logout);
    // } catch {
    //   // On déconnecte côté client même si le backend est inaccessible
    // } finally {
      clearToken();
      setUser(null);
      setLocalUser(null);
      navigate(PATHS.auth.login, { replace: true });
    // }
  }, [navigate]);
  // --- Update Session ---
  const updateSession = useCallback(async (newUserData) => {
    // Si nous envoyons PATCH /auth/me/ avec le nouveau "name"
    const response = await apiClient.patch(API_CONFIG.endpoints.me, { body: newUserData });
    // response = { user: { ...updatedUser } }
    if (response && response.user) {
      setUser(response.user);
      setLocalUser(response.user);
      return response.user;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, updateSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("[useAuth] doit être utilisé dans un <AuthProvider>");
  return context;
}