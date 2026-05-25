import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext.store";

/**
 * Hook pour accéder au contexte d'authentification
 * À utiliser partout pour accéder aux infos utilisateur et fonctions auth
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("[useAuth] doit être utilisé dans un <AuthProvider>");
  return context;
}
