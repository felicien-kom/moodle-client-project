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
  const STATIC_USERS = [
      {
        id: 1,
        email: "user@gmail.com",
        password: "Password123!",
        name: "user",
        role: "student",
        avatar: null,
      },
    ];
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

    /* 
    // Commenté pour le développement frontend
    apiClient.get("/auth/me")
      .then(setUser)
      .catch(() => {
        // Token invalide ou expiré sans refresh possible → on nettoie
        clearTokens();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
    */

    // Simulation pour le frontend : vérifier si le token correspond à un utilisateur statique
    setIsLoading(false);
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
    // Vérification avec les utilisateurs statiques
    const staticUser = STATIC_USERS.find(
      user => user.email === email && user.password === password
    );

    if (!staticUser) {
      throw new Error("Email ou mot de passe incorrect");
    }

    // Simulation de tokens pour le développement frontend
    const mockTokens = {
      accessToken: "mock-access-token-" + Date.now(),
      refreshToken: "mock-refresh-token-" + Date.now(),
    };
    setTokens(mockTokens);
    setUser(staticUser);

    return { user: staticUser, ...mockTokens }; // l'appelant peut en avoir besoin (redirection, etc.)
  }, []);

  const logout = useCallback(async () => {
    try {
      /* 
      // Commenté pour le développement frontend
      // Informe le backend (révocation du refresh token)
      await apiClient.post("/auth/logout");
      */
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