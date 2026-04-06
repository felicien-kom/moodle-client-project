// src/sync/push/index.js
// Orchestre le PUSH dans l'ordre des dépendances.
// moodleFetch lit MOODLE_URL depuis env — pas de moodleSiteUrl dans ctx.
//
// Annotations : local-only par conception, jamais pushées vers Moodle
// Pas de code nécessaire ici - elles sont générées uniquement par leurs endpoints CRUD locaux.

import { pushProfile }     from "./pushProfile.js";
import { pushAttempts }    from "./pushAttempts.js";
import { pushAssignments } from "./pushAssignments.js";

export const pushAll = async (ctx) => {
  let pushed = 0;
  let conflicts = 0;

  const r1 = await pushProfile(ctx);
  pushed += r1.pushed; conflicts += r1.conflicts;

  const r2 = await pushAttempts(ctx);
  pushed += r2.pushed; conflicts += r2.conflicts;

  const r3 = await pushAssignments(ctx);
  pushed += r3.pushed; conflicts += r3.conflicts;

  // // Annotations : local seulement, jamais pushées vers Moodle
  // const pendingAnnotations = await ctx.prisma.annotation.count();
  // if (pendingAnnotations > 0) {
  //   ctx.emitter.emit("progress", {
  //     step:   "PUSH",
  //     entity: "annotations",
  //     status: "local_only",
  //     note:   "Annotations are local-only and never synced to Moodle",
  //   });
  // }

  return { pushed, conflicts };
};