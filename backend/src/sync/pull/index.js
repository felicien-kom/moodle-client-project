// src/sync/pull/index.js
import { pullProfile }                 from "./pullProfile.js";
import { pullCourses }                 from "./pullCourses.js";
import { pullCourseParticipants }      from "./pullCourseParticipants.js"; // <-- NOUVEAU
import { pullCalendarEvents }          from "./pullCalendarEvents.js";
import { pullCourseStructure }         from "./pullCourseStructure.js";
import { pullFileResources }           from "./pullFileResources.js";
import { pullFolderResources }         from "./pullFolderResources.js"; 
import { pullExternalUrls }            from "./pullExternalUrls.js";
import { pullAssignments }             from "./pullAssignments.js";
import { pullAssignmentSubmissions }   from "./pullAssignmentSubmissions.js";
import { pullGrades }                  from "./pullGrades.js";

export const pullAll = async (ctx) => {
  let pulled = 0;
  let conflicts = 0;

  const add = (r) => { 
    pulled += r?.pulled || 0; 
    conflicts += r?.conflicts || 0; 
  };

  // 1. Profil et Cours
  add(await pullProfile(ctx));
  add(await pullCourses(ctx));
  add(await pullCourseParticipants(ctx)); // <-- AJOUTÉ ICI

  // 2. Événements
  add(await pullCalendarEvents(ctx));

  // 3. Structure (Sections et Modules)
  add(await pullCourseStructure(ctx));

  // 4. Contenus spécifiques & Fichiers
  add(await pullFileResources(ctx));
  add(await pullFolderResources(ctx)); 
  add(await pullExternalUrls(ctx));
  add(await pullAssignments(ctx));
  add(await pullAssignmentSubmissions(ctx));

  // 5. Notes
  add(await pullGrades(ctx));

  return { pulled, conflicts };
};