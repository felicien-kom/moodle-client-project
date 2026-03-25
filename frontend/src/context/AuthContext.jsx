import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "@/client/apiClient";
import { clearTokens, getAccessToken, setTokens } from "@/utils/api.utils";
import { PATHS } from "@/router/paths";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true le temps de vérifier le token initial
  const navigate = useNavigate();

  const isAuthenticated = user !== null;

  // --- Vérification initiale au montage ---
  // Si un token existe en storage, on tente de récupérer le profil utilisateur.
  // C'est ce qui permet de rester connecté après un refresh de page.
  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    apiClient.get("/auth/me")
      .then(setUser)
      .catch(() => {
        // Token invalide ou expiré sans refresh possible → on nettoie
        clearTokens();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // --- Réaction à la session expirée (émis par apiClient après échec du refresh) ---
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      navigate(PATHS.auth.login, { replace: true });
    };

    window.addEventListener("auth:session-expired", handleExpired);
    return () => window.removeEventListener("auth:session-expired", handleExpired);
  }, [navigate]);

  // --- Actions ---

  const login = useCallback(async ({ email, password }) => {
    const data = await apiClient.post("/auth/login", {
      body:     { email, password },
      withAuth: false, // pas de token à ce stade
    });

    setTokens({
      accessToken:  data.accessToken,
      refreshToken: data.refreshToken,
    });

    setUser(data.user);

    return data; // l'appelant peut en avoir besoin (redirection, etc.)
  }, []);

  const logout = useCallback(async () => {
    try {
      // Informe le backend (révocation du refresh token)
      await apiClient.post("/auth/logout");
    } catch {
      // On continue même si le backend est inaccessible
    } finally {
      clearTokens();
      setUser(null);
      navigate(PATHS.auth.login, { replace: true });
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("[useAuth] doit être utilisé dans un <AuthProvider>");
  return context;
}