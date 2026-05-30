import apiClient from "@/client/apiClient";

/**
 * Vérifie si le serveur Moodle est joignable
 * @returns {Promise<boolean>} true si Moodle est joignable, false sinon
 */
export async function checkMoodleStatus() {
  try {
    const response = await apiClient.get("/auth/moodle-status");
    return response.reachable === true;
  } catch (error) {
    console.error("Erreur lors de la vérification du statut Moodle:", error);
    return false;
  }
}
