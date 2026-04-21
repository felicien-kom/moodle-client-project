// src/sync/pull/pullGrades.js
// Pull des notes de l'utilisateur pour tous les cours inscrits.
// Propriétaire : SERVER — les notes sont attribuées par l'enseignant.
//
// Moodle fonction : gradereport_user_get_grade_items
// Retourne toutes les activités notées d'un cours pour un utilisateur.

import { moodleFetch } from "../../config/moodleApi.js";

export const pullGrades = async ({ prisma, token, moodleUserId, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "grades", status: "start" });

  if (!moodleUserId) {
    emitter.emit("progress", { step: "PULL", entity: "grades", status: "done", pulled: 0 });
    return { pulled: 0, conflicts: 0 };
  }

  const enabledServerIds = await _getEnabledCourseServerIds(prisma);
  const localCourses = await prisma.course.findMany({
    where:  { server_id: { in: enabledServerIds } },
    select: { id: true, server_id: true },
  });

  if (localCourses.length === 0) {
    emitter.emit("progress", { step: "PULL", entity: "grades", status: "done", pulled: 0 });
    return { pulled: 0, conflicts: 0 };
  }

  let pulled = 0;

  for (const localCourse of localCourses) {
    try {
      const { data: response } = await moodleFetch(
        "gradereport_user_get_grade_items",
        { courseid: localCourse.server_id, userid: moodleUserId },
        token
      );

      const usergrades = response.usergrades?.[0];
      if (!usergrades) continue;

      for (const item of usergrades.gradeitems ?? []) {
        // Calculer le pourcentage si possible
        let percentage = null;
        if (item.grademax && item.graderaw !== null && item.graderaw !== undefined) {
          percentage = Math.round((item.graderaw / item.grademax) * 1000) / 10;
        }

        // server_id basé sur itemid Moodle
        const serverId = item.id;

        await prisma.grade.upsert({
          where:  { server_id: serverId },
          update: {
            itemName:    item.itemname  ?? item.itemmodule ?? "unknown",
            itemType:    item.itemtype  ?? item.itemmodule ?? "unknown",
            itemInstance: item.cmid     ?? null,
            grade:       item.graderaw  ?? null,
            maxGrade:    item.grademax  ?? null,
            percentage,
            sync_status: "SYNCED",
          },
          create: {
            courseId:    localCourse.id,
            server_id:   serverId,
            itemName:    item.itemname  ?? item.itemmodule ?? "unknown",
            itemType:    item.itemtype  ?? item.itemmodule ?? "unknown",
            itemInstance: item.cmid     ?? null,
            grade:       item.graderaw  ?? null,
            maxGrade:    item.grademax  ?? null,
            percentage,
            sync_status: "SYNCED",
          },
        });
        pulled++;
      }
    } catch (err) {
      // Les notes ne sont pas disponibles sur tous les cours — ne pas bloquer
      emitter.emit("progress", {
        step: "PULL_ERROR", entity: "grades",
        courseServerId: localCourse.server_id, error: err.message,
      });
    }
  }

  emitter.emit("progress", { step: "PULL", entity: "grades", status: "done", pulled });
  return { pulled, conflicts: 0 };
};

const _getEnabledCourseServerIds = async (prisma) => {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { syncEnabled: true }, select: { courseServerId: true },
  });
  return enrollments.map(e => e.courseServerId);
};