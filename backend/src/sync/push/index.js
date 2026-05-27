// src/sync/push/index.js
// Orchestre le PUSH dans l'ordre des dépendances.

import { pushProfile }         from "./pushProfile.js";
import { pushAssignmentSubmissions }     from "./pushAssignmentSubmissions.js";
import { pushCalendarEvents }  from "./pushCalendarEvents.js"; // <-- Nouvel import

export const pushAll = async (ctx) => {
  let pushed = 0;
  let conflicts = 0;

  // 1. Profil
  const r1 = await pushProfile(ctx);
  pushed += r1.pushed; conflicts += r1.conflicts;

  // 2. Événements du calendrier
  const r2 = await pushCalendarEvents(ctx); // <-- Ajout
  pushed += r2.pushed; conflicts += r2.conflicts;

  // 3. Soumissions de devoirs
  const r3 = await pushAssignmentSubmissions(ctx);
  pushed += r3.pushed; conflicts += r3.conflicts;

  return { pushed, conflicts };
};