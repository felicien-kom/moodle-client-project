import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext.store";
import { mockLogin } from "@/services/mockAuth";
import { clearTokens, getAccessToken, setTokens } from "@/utils/api.utils";
import { PATHS } from "@/router/paths";

const AUTH_USER_STORAGE_KEY = "auth_user";

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = user !== null;

  // --- Vérification initiale au montage ---
  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        clearTokens();
      }
    } catch {
      clearTokens();
      setUser(null);
    }

    setIsLoading(false);
  }, []);

  // --- Actions ---

  const login = useCallback(async ({ email, password }) => {
    // Utilise le mock local pour les tests
    const data = await mockLogin(email, password);

    setTokens({
      accessToken:  data.accessToken,
      refreshToken: data.refreshToken,
    });

    setUser(data.user);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(data.user));
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      // En production, appeler apiClient.post("/auth/logout")
    } catch {
      // On continue même si le backend est inaccessible
    } finally {
      clearTokens();
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
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
