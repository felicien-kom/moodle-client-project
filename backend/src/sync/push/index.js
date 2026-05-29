// src/sync/push/index.js
import { pushProfile }                 from "./pushProfile.js";
import { pushCalendarEvents }          from "./pushCalendarEvents.js";
import { pushAssignmentSubmissions }   from "./pushAssignmentSubmissions.js"; 
import { pushAssignmentGrades }        from "./pushAssignmentGrades.js"; 
import { pushCourses }                 from "./pushCourses.js"; 
import { pushCourseModules }           from "./pushCourseModules.js"; 
export const pushAll = async (ctx) => {
  let pushed = 0;
  let conflicts = 0;

  // 1. Profil
  const r1 = await pushProfile(ctx);
  pushed += r1.pushed; conflicts += r1.conflicts;

  // 2. Événements du calendrier
  const r2 = await pushCalendarEvents(ctx);
  pushed += r2.pushed; conflicts += r2.conflicts;

  // 3. Soumissions de devoirs (Côté ÉTUDIANT)
  // (Assurez-vous d'ajouter if(user.role === 'TEACHER') return; dans ce script !)
  const r3 = await pushAssignmentSubmissions(ctx); 
  pushed += r3.pushed; conflicts += r3.conflicts;

  // 4. Notes et Corrections (Côté PROFESSEUR)
  const r4 = await pushAssignmentGrades(ctx); 
  pushed += r4.pushed; conflicts += r4.conflicts;

  // 5. Création de Cours (Côté PROFESSEUR)
  const r5 = await pushCourses(ctx);
  pushed += r5.pushed; conflicts += r5.conflicts;

  // 6. Création de modules de cours (Côté PROFESSEUR)
  const r6 = await pushCourseModules(ctx);
  pushed += r6.pushed; conflicts += r6.conflicts;

  return { pushed, conflicts };
};