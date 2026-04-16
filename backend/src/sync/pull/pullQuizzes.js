// src/sync/pull/pullQuizzes.js
import { moodleFetch } from "../../config/moodleApi.js";
import { diagnose, diagnoseNew, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pullQuizzes = async ({ prisma, token, cursor, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "quizzes", status: "start" });

  const localCourses = await prisma.course.findMany({
    where:  { server_id: { not: null } },
    select: { id: true, server_id: true },
  });

  if (localCourses.length === 0) {
    emitter.emit("progress", { step: "PULL", entity: "quizzes", status: "done", pulled: 0 });
    return { pulled: 0, conflicts: 0 };
  }

  const { data: response } = await moodleFetch(
    "mod_quiz_get_quizzes_by_courses",
    { courseids: localCourses.map((c) => c.server_id) },
    token
  );

  const serverQuizzes = response.quizzes ?? [];
  let pulled = 0;
  let conflicts = 0;

  for (const serverQuiz of serverQuizzes) {
    const serverTimemodified = serverQuiz.timemodified;
    const localCourse = localCourses.find((c) => c.server_id === serverQuiz.course);
    if (!localCourse) continue;

    const local = await prisma.quiz.findFirst({ where: { server_id: serverQuiz.id } });
    let action;

    if (!local) {
      action = diagnoseNew();
    } else {
      if (local.sync_status === "SYNCED" && local.last_synced_at >= cursor) continue;
      action = diagnose(local, serverTimemodified, cursor);

      if (action === SyncCase.CONFLICT) {
        action = resolveConflict("quiz");
        conflicts++;
        emitter.emit("progress", {
          step: "CONFLICT", entity: "quiz",
          id: serverQuiz.id, resolution: action,
        });
      }
    }

    if (action === SyncCase.PULL) {
      await prisma.quiz.upsert({
        where:  { server_id: serverQuiz.id },
        update: {
          name:                serverQuiz.name,
          intro:               serverQuiz.intro ?? null,
          timeLimit:           serverQuiz.timelimit ?? null,
          maxAttempts:         serverQuiz.attempts ?? 0,
          gradeMethod:         serverQuiz.grademethod ?? 1,
          sumGrades:           serverQuiz.sumgrades ?? null,
          visible:             Boolean(serverQuiz.visible ?? 1),
          server_timemodified: serverTimemodified,
          sync_status:         "SYNCED",
          last_synced_at:      serverTimemodified,
        },
        create: {
          courseId:            localCourse.id,
          name:                serverQuiz.name,
          intro:               serverQuiz.intro ?? null,
          timeLimit:           serverQuiz.timelimit ?? null,
          maxAttempts:         serverQuiz.attempts ?? 0,
          gradeMethod:         serverQuiz.grademethod ?? 1,
          sumGrades:           serverQuiz.sumgrades ?? null,
          visible:             Boolean(serverQuiz.visible ?? 1),
          server_id:           serverQuiz.id,
          server_timemodified: serverTimemodified,
          sync_status:         "SYNCED",
          last_synced_at:      serverTimemodified,
        },
      });
      pulled++;
      emitter.emit("progress", { step: "PULL", entity: "quiz", id: serverQuiz.id, name: serverQuiz.name });
    }
  }

  emitter.emit("progress", { step: "PULL", entity: "quizzes", status: "done", pulled, conflicts });
  return { pulled, conflicts };
};