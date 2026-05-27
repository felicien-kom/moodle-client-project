// src/sync/pull/pullCourseParticipants.js
import { moodleFetch } from "../../config/moodleApi.js";

export const pullCourseParticipants = async ({ prisma, token, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "participants", status: "start" });

  const enrollments = await prisma.courseEnrollment.findMany({ where: { syncEnabled: true } });
  if (enrollments.length === 0) return { pulled: 0, conflicts: 0 };

  let pulled = 0;
  
  for (const enrollment of enrollments) {
    const localCourse = await prisma.course.findFirst({ where: { server_id: enrollment.courseServerId } });
    if (!localCourse) continue;

    try {
      const { data: users } = await moodleFetch(
        "core_enrol_get_enrolled_users",
        { courseid: enrollment.courseServerId },
        token
      );

      if (!Array.isArray(users)) continue;

      for (const user of users) {
        // Upsert permet de mettre à jour le nom/photo s'ils ont changé sur Moodle
        await prisma.courseParticipant.upsert({
          where: {
            courseId_moodleUserId: {
              courseId: localCourse.id,
              moodleUserId: user.id
            }
          },
          update: {
            fullname: user.fullname,
            email: user.email ?? null,
            profileImageUrl: user.profileimageurl ?? null,
          },
          create: {
            courseId: localCourse.id,
            moodleUserId: user.id,
            fullname: user.fullname,
            email: user.email ?? null,
            profileImageUrl: user.profileimageurl ?? null,
          }
        });
        pulled++;
      }
    } catch (err) {
      // Ignorer si l'utilisateur n'a pas les droits de voir les participants (ex: étudiant avec restrictions)
    }
  }

  emitter.emit("progress", { step: "PULL", entity: "participants", status: "done", pulled });
  return { pulled, conflicts: 0 };
};