// src/sync/push/index.js
// Orchestre le PUSH dans l'ordre des dépendances.

import { pushProfile }     from "./pushProfile.js";
import { pushAssignments } from "./pushAssignments.js";

export const pushAll = async (ctx) => {
  let pushed = 0;
  let conflicts = 0;

  const r1 = await pushProfile(ctx);
  pushed += r1.pushed; conflicts += r1.conflicts;

  const r2 = await pushAssignments(ctx);
  pushed += r2.pushed; conflicts += r2.conflicts;

  return { pushed, conflicts };
};