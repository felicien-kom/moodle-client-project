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
import { AuthContext } from "./AuthContext.store";
import { userRole } from "@/services/user.service";
import { checkMoodleStatus } from "@/services/moodle.service";

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [profiles,  setProfiles]  = useState([]);
  const [isOnline,  setIsOnline]  = useState(navigator.onLine);
  const [isMoodleOnline, setIsMoodleOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = user !== null;

  const refreshProfiles = useCallback(async () => {
    try {
      const data = await apiClient.get(API_CONFIG.endpoints.profiles, { withAuth: false });
      setProfiles(data?.profiles ?? []);
      return data?.profiles ?? [];
    } catch {
      setProfiles([]);
      return [];
    }
  }, []);

  // --- Vérification initiale : token en storage → récupérer le profil ---
  useEffect(() => {
    const token = getToken();

    if (!token) {
      refreshProfiles().finally(() => setIsLoading(false));
      return;
    }

    apiClient
      .get(API_CONFIG.endpoints.me)
      .then((data) => {
        const profile = data?.user ?? data ?? null;
        setUser(profile);
        if (profile) userRole(profile);
      })
      .catch(() => {
        // clearToken();
        setUser(null);
      })
      .finally(() => {
        refreshProfiles().finally(() => setIsLoading(false));
      });
  }, [refreshProfiles]);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Vérification périodique du statut du serveur Moodle
  useEffect(() => {
    const checkMoodle = async () => {
      const reachable = await checkMoodleStatus();
      setIsMoodleOnline(reachable);
    };

    // Vérification initiale
    checkMoodle();

    // Vérification toutes les 30 secondes
    const interval = setInterval(checkMoodle, 30000);

    return () => clearInterval(interval);
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
  const login = useCallback(async ({ username, email, password }) => {
    const identifier = username ?? email;

    if (!identifier) {
      const err = new Error("Identifiant requis");
      err.isApiError = true;
      err.status = 400;
      throw err;
    }

    const data = await apiClient.post(API_CONFIG.endpoints.login, {
      body:     { username: identifier, clientPassword: password },
      withAuth: false,
    });

    // Adaptez selon ce que renvoie votre backend :
    // { access: "...", user: {...} }  ou  { token: "...", user: {...} }
    const token = data.token ?? data.access;
    if (!token) throw { isApiError: true, status: 500, message: "Token absent dans la réponse.", data };

    setToken(token);

    // Si le backend renvoie le profil dans la réponse de login, on l'utilise directement.
    // Sinon on le récupère via /auth/me.
    const meData = data.user ? null : await apiClient.get(API_CONFIG.endpoints.me);
    const profile = data.user ?? meData?.user ?? meData;
    setUser(profile);
    setLocalUser(profile);
    userRole(profile);
    await refreshProfiles();

    return profile;
  }, [refreshProfiles]);

  const createProfile = useCallback(async ({ username, email, moodlePassword, localPassword, confirmLocalPassword }) => {
    // if (!navigator.onLine) {
    //   const err = new Error("Creation de profil impossible hors ligne.");
    //   err.isApiError = true;
    //   err.status = 0;
    //   throw err;
    // }

    if (localPassword !== confirmLocalPassword) {
      const err = new Error("Les mots de passe locaux ne correspondent pas.");
      err.isApiError = true;
      err.status = 400;
      throw err;
    }

    const data = await apiClient.post(API_CONFIG.endpoints.register, {
      body: {
        username,
        email,
        serverPassword: moodlePassword,
        clientPassword: localPassword,
      },
      withAuth: false,
    });

    if (data?.token) {
      clearToken();
      setUser(null);
    }

    await refreshProfiles();
    return data;
  }, [refreshProfiles]);

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
      localStorage.removeItem("user_role");
      navigate(PATHS.auth.login, { replace: true });
    // }
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profiles,
        isOnline,
        isMoodleOnline,
        isAuthenticated,
        isLoading,
        login,
        logout,
        createProfile,
        refreshProfiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("[useAuth] doit être utilisé dans un <AuthProvider>");
  return context;
}