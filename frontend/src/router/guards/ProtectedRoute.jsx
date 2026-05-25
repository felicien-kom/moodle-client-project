import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PATHS } from "@/router/paths";
import PageLoader from "@/pages/others/PageLoader";

/**
 * Protected Route Guard
 * Redirige vers login si l'utilisateur n'est pas authentifié
 * Mémorise la page demandée pour y revenir après la connexion
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  // Si pas authentifié → rediriger vers login
  if (!isAuthenticated) {
    return <Navigate to={PATHS.auth.login} state={{ from: location }} replace />;
  }

  // Utilisateur connecté → afficher la page
  return <Outlet />;
}

export default ProtectedRoute;
