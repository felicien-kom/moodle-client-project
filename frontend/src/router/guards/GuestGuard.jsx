import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PATHS } from "@/router/paths";
import PageLoader from "@/pages/others/PageLoader";

/**
 * Guest Guard
 * Redirige les utilisateurs DÉJÀ connectés vers le tableau de bord
 * (Empêche l'accès aux pages Login, Register, etc.)
 */
export function GuestGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  // Si on est déjà connecté, on n'a rien à faire sur les pages d'auth
  if (isAuthenticated) {
    // S'il essayait d'aller quelque part avant d'être bloqué (ou juste retour accueil app)
    const from = location.state?.from?.pathname || PATHS.app.dashboard;
    return <Navigate to={from} replace />;
  }

  // Utilisateur non connecté → afficher la page (login, etc)
  return <Outlet />;
}

export default GuestGuard;
