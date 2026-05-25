import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PATHS } from "../paths";
import { useAuth } from "@/context/AuthContext";

/**
 * Protège les routes privées.
 * - Non authentifié → redirige vers /login en mémorisant la page demandée
 * - Authentifié     → laisse passer
 */
function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Pendant la vérification initiale du token, on ne redirige pas encore
  if (isLoading) return null; // ou un spinner global

  if (!isAuthenticated) {
    return (
      <Navigate
        to={PATHS.auth.login}
        state={{ from: location }} // mémorise la page pour rediriger après login
        replace
      />
    );
  }

  return <Outlet />;
}

export default AuthGuard;