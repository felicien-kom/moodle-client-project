// src/sync/pull/index.js
// Ordre strict : profil → cours → quiz → tentatives → devoirs
// moodleFetch lit MOODLE_URL depuis env — pas de moodleSiteUrl dans ctx.

import { pullProfile }     from "./pullProfile.js";
import { pullCourses }     from "./pullCourses.js";
import { pullEvents }      from "./pullEvents.js";
import { pullQuizzes }     from "./pullQuizzes.js";
import { pullAttempts }    from "./pullAttempts.js";
import { pullAssignments } from "./pullAssignments.js";

export const pullAll = async (ctx) => {
  let pulled = 0;
  let conflicts = 0;

  const r1 = await pullProfile(ctx);
  pulled += r1.pulled; conflicts += r1.conflicts;
  
  const r6 = await pullEvents(ctx);
  pulled += r6.pulled; conflicts += r6.conflicts;

  const r2 = await pullCourses(ctx);
  pulled += r2.pulled; conflicts += r2.conflicts;

  const r3 = await pullQuizzes(ctx);
  pulled += r3.pulled; conflicts += r3.conflicts;

  const r4 = await pullAttempts(ctx);
  pulled += r4.pulled; conflicts += r4.conflicts;

  const r5 = await pullAssignments(ctx);
  pulled += r5.pulled; conflicts += r5.conflicts;

  return { pulled, conflicts };
};