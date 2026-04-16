// src/sync/resolve.js
// Règle du propriétaire — qui gagne en cas de conflit par type d'entité.
// Logique pure, aucune dépendance.

import { SyncCase } from "./diagnose.js";

// SERVER = le serveur Moodle fait autorité (contenu créé par enseignant)
// CLIENT = l'utilisateur local fait autorité (données produites par l'étudiant)
const OWNER = {
  profile:                "CLIENT",  // l'utilisateur connaît son propre profil
  course:                 "SERVER",  // cours créés/modifiés par l'enseignant sur Moodle
  module:                 "SERVER",
  quiz:                   "SERVER",
  quiz_question:          "SERVER",
  quiz_attempt:           "CLIENT",  // tentative = propriété exclusive étudiant
  quiz_answer:            "CLIENT",  // réponses = propriété exclusive étudiant
  assignment:             "SERVER",
  assignment_submission:  "CLIENT",  // devoir rendu = propriété exclusive étudiant
  annotation:             "CLIENT",  // notes personnelles = TOUJOURS client gagne
};

/**
 * @param {keyof OWNER} entityType
 * @returns {SyncCase.PULL | SyncCase.PUSH}
 */
export const resolveConflict = (entityType) => {
  const owner = OWNER[entityType] ?? "SERVER";
  return owner === "SERVER" ? SyncCase.PULL : SyncCase.PUSH;
};