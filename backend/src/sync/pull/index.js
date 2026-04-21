// src/sync/pull/index.js
// Ordre strict — respecter les dépendances hiérarchiques :
//   profil → cours (inscriptions) → modules/ressources → quiz → tentatives → devoirs → notes

import { pullProfile }     from "./pullProfile.js";
import { pullCourses }     from "./pullCourses.js";
import { pullModules }     from "./pullModules.js";
import { pullQuizzes }     from "./pullQuizzes.js";
import { pullAttempts }    from "./pullAttempts.js";
import { pullAssignments } from "./pullAssignments.js";
import { pullGrades }      from "./pullGrades.js";

export const pullAll = async (ctx) => {
  let pulled = 0;
  let conflicts = 0;

  const add = (r) => { pulled += r.pulled; conflicts += r.conflicts; };

  add(await pullProfile(ctx));
  add(await pullCourses(ctx));
  add(await pullModules(ctx));
  add(await pullQuizzes(ctx));
  add(await pullAttempts(ctx));
  add(await pullAssignments(ctx));
  add(await pullGrades(ctx));

  return { pulled, conflicts };
};