/**
 * Service pour gérer les informations de l'utilisateur
 */

/**
 * Récupère ou stocke le rôle de l'utilisateur connecté dans le localStorage.
 * Si un paramètre (la réponse du login ou l'objet utilisateur) est passé,
 * extrait le rôle, l'enregistre dans le localStorage et le retourne.
 * Sinon, retourne le rôle actuellement stocké dans le localStorage.
 * 
 * @param {Object|string} [loginResponse] - Optionnel. La réponse du login ou l'objet contenant le rôle.
 * @returns {string|null} Le rôle de l'utilisateur (par exemple : "student", "teacher", "admin").
 */
export function userRole(loginResponse) {
  if (loginResponse) {
    let role = null;

    if (typeof loginResponse === "string") {
      role = loginResponse;
    } else if (loginResponse.role) {
      role = loginResponse.role;
    } else if (loginResponse.user?.role) {
      role = loginResponse.user.role;
    }

    if (role) {
      // Normaliser en minuscules pour être cohérent avec les guards et hooks du front
      const normalizedRole = role.toLowerCase();
      localStorage.setItem("user_role", normalizedRole);
      return normalizedRole;
    }
  }

  return localStorage.getItem("user_role");
}
