// src/sync/resolve.js
// Règle du propriétaire — qui gagne en cas de conflit par type d'entité.
// Logique pure, aucune dépendance.

import { SyncCase } from "./diagnose.js";

// SERVER = le serveur Moodle fait autorité (contenu créé par enseignant)
// CLIENT = l'utilisateur local fait autorité (données produites par l'étudiant)
const OWNER = {
  profile:                "CLIENT",  // l'utilisateur connaît son propre profil
  course:                 "SERVER",  // cours créés/modifiés par l'enseignant
  section:                "SERVER",  // structure gérée par l'enseignant
  module:                 "SERVER",  // enveloppe gérée par l'enseignant
  event:                  "SERVER",  // événements du calendrier
  
  // Contenus spécifiques
  file_resource:          "SERVER",
  folder_resource:        "SERVER",
  external_url:           "SERVER",
  assignment:             "SERVER",
  
  // Quiz (Gérés par le prof, tentatives par l'étudiant)
  quiz:                   "SERVER",
  quiz_question:          "SERVER",
  quiz_attempt:           "CLIENT",
  quiz_answer:            "CLIENT",
  
  // Rendu de devoir
  assignment_submission:  "CLIENT",  // devoir rendu = propriété exclusive étudiant
  
  // Notes
  grade:                  "SERVER",  // Les notes sont dictées par le prof/serveur
};

/**
 * @param {keyof OWNER} entityType
 * @returns {SyncCase.PULL | SyncCase.PUSH}
 */
export const resolveConflict = (entityType) => {
  const owner = OWNER[entityType] ?? "SERVER";
  return owner === "SERVER" ? SyncCase.PULL : SyncCase.PUSH;
};