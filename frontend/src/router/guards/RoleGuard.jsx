import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PATHS } from "@/router/paths";
import PageLoader from "@/pages/others/PageLoader";

/**
 * Role Guard
 * Restreint l'accès à certaines routes en fonction des rôles autorisés
 * @param {string[]} allowedRoles - Tableau des rôles autorisés (ex: ["admin", "teacher"])
 */
export function RoleGuard({ allowedRoles }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  // Si l'utilisateur n'a pas un rôle autorisé, on le redirige (souvent vers le dashboard)
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={PATHS.app.dashboard} replace />;
  }

  // Utilisateur autorisé → afficher la page
  return <Outlet />;
}

export default RoleGuard;
