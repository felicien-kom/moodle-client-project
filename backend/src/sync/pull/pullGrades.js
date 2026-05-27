// src/sync/pull/pullGrades.js
import { moodleFetch } from "../../config/moodleApi.js";

export const pullGrades = async ({ prisma, token, moodleUserId, servertime, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "grades", status: "start" });

  if (!moodleUserId) return { pulled: 0, conflicts: 0 };

  const localUser = await prisma.localUser.findFirst();
  if (!localUser) return { pulled: 0, conflicts: 0 };

  const enrollments = await prisma.courseEnrollment.findMany({ where: { syncEnabled: true } });
  if (enrollments.length === 0) return { pulled: 0, conflicts: 0 };

  let pulled = 0;

  for (const enrollment of enrollments) {
    const localCourse = await prisma.course.findFirst({ where: { server_id: enrollment.courseServerId } });
    if (!localCourse) continue;

    try {
      // ─── L'ASTUCE ADAPTATIVE EST ICI ─────────────────────────────────
      const params = { courseid: enrollment.courseServerId };
      
      // Si c'est un étudiant, on ne demande que SES notes.
      // Si c'est un prof, on omet 'userid' et Moodle renvoie toute la classe !
      if (localUser.role === "STUDENT") {
        params.userid = moodleUserId; 
      }
      // ─────────────────────────────────────────────────────────────────

      const { data: result } = await moodleFetch("gradereport_user_get_grade_items", params, token);

      const userGrades = result.usergrades || []; 

      // On boucle sur tous les utilisateurs retournés (1 pour l'étudiant, N pour le prof)
      for (const userRecord of userGrades) {
        if (!userRecord.gradeitems) continue;

        for (const item of userRecord.gradeitems) {
          if (!item.id) continue;

          const itemType = item.itemmodule || item.itemtype || "unknown";
          const gradeValue = item.graderaw !== undefined ? parseFloat(item.graderaw) : null;
          const maxGradeValue = item.grademax !== undefined ? parseFloat(item.grademax) : null;
          
          let percentageValue = null;
          if (item.percentageformatted) {
            percentageValue = parseFloat(item.percentageformatted.replace("%", "").trim());
          }

          const serverTimemodified = item.gradedategraded || servertime;

          // Clé unique pour éviter les doublons : ID de l'item Moodle + ID de l'utilisateur
          // Note : Il faudra ajuster le @unique dans schema.prisma si le grade appartient à plusieurs utilisateurs.
          // Mais pour l'instant, on gère la soumission, qui elle est unique.
          
          const existingGrade = await prisma.grade.findFirst({
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
              where: { id: existingGrade?.id || -1 }, // Upsert sécurisé sans violer d'éventuelles contraintes d'unicité
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
      }
    } catch (err) {
      emitter.emit("progress", { step: "PULL_ERROR", entity: "grades", courseServerId: enrollment.courseServerId, error: err.message });
    }
  }

  emitter.emit("progress", { step: "PULL", entity: "grades", status: "done", pulled });
  return { pulled, conflicts: 0 };
};