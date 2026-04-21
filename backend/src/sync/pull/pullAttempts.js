// src/sync/pull/pullAttempts.js
// Pull des tentatives de quiz de l'utilisateur.
// Propriétaire CLIENT — on pull surtout pour récupérer les corrections et notes.

import { moodleFetch } from "../../config/moodleApi.js";
import { diagnose, diagnoseNew, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pullAttempts = async ({ prisma, token, cursor, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "attempts", status: "start" });

  const localQuizzes = await prisma.quiz.findMany({
    where:  { server_id: { not: null } },
    select: { id: true, server_id: true },
  });

  if (localQuizzes.length === 0) {
    emitter.emit("progress", { step: "PULL", entity: "attempts", status: "done", pulled: 0 });
    return { pulled: 0, conflicts: 0 };
  }

  let pulled = 0;
  let conflicts = 0;

  for (const localQuiz of localQuizzes) {
    const { data: response } = await moodleFetch(
      "mod_quiz_get_user_attempts",
      { quizid: localQuiz.server_id, status: "all" },
      token
    );

    for (const serverAttempt of response.attempts ?? []) {
      const serverTimemodified = serverAttempt.timemodified ?? 0;
      const local = await prisma.quizAttempt.findFirst({ where: { server_id: serverAttempt.id } });
      let action;

      if (!local) {
        action = diagnoseNew();
      } else {
        if (local.sync_status === "SYNCED" && local.last_synced_at >= cursor) continue;
        action = diagnose(local, serverTimemodified, cursor);
        if (action === SyncCase.CONFLICT) {
          action = resolveConflict("quiz_attempt");
          conflicts++;
          emitter.emit("progress", { step: "CONFLICT", entity: "quiz_attempt", id: serverAttempt.id, resolution: action });
        }
      }

      if (action === SyncCase.PULL) {
        const state = _mapAttemptState(serverAttempt.state);
        await prisma.quizAttempt.upsert({
          where:  { server_id: serverAttempt.id },
          update: {
            state,
            timeStart:           serverAttempt.timestart  ?? null,
            timeFinish:          serverAttempt.timefinish ?? null,
            sumGrades:           serverAttempt.sumgrades  ?? null,
            server_timemodified: serverTimemodified,
            sync_status:         "SYNCED",
            last_synced_at:      serverTimemodified,
          },
          create: {
            quizId:              localQuiz.id,
            server_id:           serverAttempt.id,
            attemptNumber:       serverAttempt.attempt,
            state,
            timeStart:           serverAttempt.timestart  ?? null,
            timeFinish:          serverAttempt.timefinish ?? null,
            sumGrades:           serverAttempt.sumgrades  ?? null,
            server_timemodified: serverTimemodified,
            sync_status:         "SYNCED",
            last_synced_at:      serverTimemodified,
          },
        });
        pulled++;
        emitter.emit("progress", { step: "PULL", entity: "attempt", id: serverAttempt.id, state });
      }
    }
  }

  emitter.emit("progress", { step: "PULL", entity: "attempts", status: "done", pulled, conflicts });
  return { pulled, conflicts };
};

const _mapAttemptState = (moodleState) => {
  switch (moodleState) {
    case "inprogress": return "IN_PROGRESS";
    case "finished":
    case "abandoned":  return "SUBMITTED";
    default:           return "IN_PROGRESS";
  }
};