import { useAuth } from "@/hooks/useAuth";

/**
 * Hook pour vérifier le rôle de l'utilisateur
 * Utile pour les permissions dans les composants
 */
export function useUserRole() {
  const { user } = useAuth();
  const normalizedRole = String(user?.role || "").toLowerCase();

  return {
    isStudent: normalizedRole === "student",
    isTeacher: normalizedRole === "teacher",
    isAdmin: normalizedRole === "admin",
    role: normalizedRole,
    user,
  };
}
