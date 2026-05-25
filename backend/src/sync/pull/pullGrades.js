// src/sync/pull/pullGrades.js
import { moodleFetch } from "../../config/moodleApi.js";

export const pullGrades = async ({ prisma, token, moodleUserId, servertime, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "grades", status: "start" });

  if (!moodleUserId) return { pulled: 0, conflicts: 0 };

  const enrollments = await prisma.courseEnrollment.findMany({ where: { syncEnabled: true } });
  if (enrollments.length === 0) return { pulled: 0, conflicts: 0 };

  let pulled = 0;

  for (const enrollment of enrollments) {
    const localCourse = await prisma.course.findFirst({ where: { server_id: enrollment.courseServerId } });
    if (!localCourse) continue;

    try {
      // Récupération du carnet de notes pour ce cours et cet utilisateur
      const { data: result } = await moodleFetch(
        "gradereport_user_get_grade_items",
        { courseid: enrollment.courseServerId, userid: moodleUserId },
        token
      );

      const userGrades = result.usergrades?.[0]; // Moodle renvoie un tableau par utilisateur
      if (!userGrades || !userGrades.gradeitems) continue;

      for (const item of userGrades.gradeitems) {
        // Ignorer les éléments purement structurels sans ID (comme les catégories vides)
        if (!item.id) continue;

        // Moodle différencie les modules (ex: assign) du total du cours (course)
        const itemType = item.itemmodule || item.itemtype || "unknown";
        const gradeValue = item.graderaw !== undefined ? parseFloat(item.graderaw) : null;
        const maxGradeValue = item.grademax !== undefined ? parseFloat(item.grademax) : null;
        
        // Moodle renvoie parfois "85.00 %" ou juste un nombre
        let percentageValue = null;
        if (item.percentageformatted) {
          percentageValue = parseFloat(item.percentageformatted.replace("%", "").trim());
        }

        // Le timestamp de notation (s'il existe) sinon on prend le servertime
        const serverTimemodified = item.gradedategraded || servertime;

        // Stratégie d'évitement d'écriture (Read-before-write)
        const existingGrade = await prisma.grade.findUnique({
          where: { server_id: item.id }
        });

        const gradeChanged = !existingGrade ||
          existingGrade.grade !== gradeValue ||
          existingGrade.maxGrade !== maxGradeValue ||
          existingGrade.percentage !== percentageValue ||
          existingGrade.itemName !== item.itemname ||
          existingGrade.courseId !== localCourse.id;

        if (gradeChanged) {
          await prisma.grade.upsert({
            where: { server_id: item.id },
            update: {
              itemName:            item.itemname || "Total",
              itemType:            itemType,
              itemInstance:        item.iteminstance ?? null,
              grade:               gradeValue,
              maxGrade:            maxGradeValue,
              percentage:          percentageValue,
              server_timemodified: serverTimemodified,
              sync_status:         "SYNCED",
              last_synced_at:      servertime,
            },
            create: {
              courseId:            localCourse.id,
              server_id:           item.id,
              itemName:            item.itemname || "Total",
              itemType:            itemType,
              itemInstance:        item.iteminstance ?? null,
              grade:               gradeValue,
              maxGrade:            maxGradeValue,
              percentage:          percentageValue,
              server_timemodified: serverTimemodified,
              sync_status:         "SYNCED",
              last_synced_at:      servertime,
            }
          });
          pulled++;
        }
      }
    } catch (err) {
      emitter.emit("progress", { step: "PULL_ERROR", entity: "grades", courseServerId: enrollment.courseServerId, error: err.message });
    }
  }

  emitter.emit("progress", { step: "PULL", entity: "grades", status: "done", pulled });
  return { pulled, conflicts: 0 };
};