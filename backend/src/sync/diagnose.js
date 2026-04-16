// src/sync/diagnose.js
// Logique pure — aucune dépendance externe, aucun appel réseau ou base de données.

export const SyncCase = {
  NOTHING:  "NOTHING",
  PULL:     "PULL",
  PUSH:     "PUSH",
  CONFLICT: "CONFLICT",
};

/**
 * Les 4 cas de diagnostic pour une entité existante localement.
 * Utilisé dans les fonctions pull pour décider quoi faire de chaque entité serveur.
 *
 * @param {object} local             - entité locale depuis Prisma
 * @param {number} serverTimemodified - timemodified reçu du serveur
 * @param {number} cursor            - curseur de la dernière sync (Unix timestamp)
 */
export const diagnose = (local, serverTimemodified, cursor) => {
  const serverChanged = serverTimemodified > cursor;
  const localChanged  = local.sync_status === "PENDING_PUSH";

  if (!serverChanged && !localChanged) return SyncCase.NOTHING;
  if (serverChanged  && !localChanged) return SyncCase.PULL;
  if (!serverChanged && localChanged)  return SyncCase.PUSH;
  return SyncCase.CONFLICT;
};

/**
 * Entité présente sur le serveur mais absente localement.
 * Toujours un PULL — nouvelle donnée à créer en local.
 * Utilisé dans les fonctions pull.
 */
export const diagnoseNew = () => SyncCase.PULL;

/**
 * Entité créée localement, jamais envoyée au serveur (server_id === null).
 * Toujours un PUSH. Pas besoin de verifier le conflit, l'entité n'existe pas encore.
 * Utilisé dans pushAttempts et pushAssignments pour les entités créées hors ligne.
 */
export const diagnoseLocalOnly = () => SyncCase.PUSH;