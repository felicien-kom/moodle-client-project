import { useAuth } from "@/hooks/useAuth";

/**
 * Hook pour vérifier le rôle de l'utilisateur
 * Utile pour les permissions dans les composants
 */
export function useUserRole() {
  const { user } = useAuth();

  return {
    isStudent: user?.role === "student",
    isTeacher: user?.role === "teacher",
    isAdmin: user?.role === "admin",
    role: user?.role,
    user,
  };
}
