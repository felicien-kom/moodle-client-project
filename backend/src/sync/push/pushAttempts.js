// src/sync/push/pushAttempts.js
// Pousse les tentatives de quiz hors ligne vers Moodle.
// Propriétaire : CLIENT — les réponses de l'étudiant gagnent toujours.
//
// Deux cas :
//   server_id === null → créée hors ligne (diagnoseLocalOnly → PUSH direct)
//   server_id !== null → modifiée après sync → vérifier conflit avant push

import { moodleFetch } from "../../config/moodleApi.js";
import { diagnoseLocalOnly, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pushAttempts = async ({ prisma, token, emitter }) => {
  emitter.emit("progress", { step: "PUSH", entity: "attempts", status: "start" });

  const pendingAttempts = await prisma.quizAttempt.findMany({
    where:   { sync_status: "PENDING_PUSH" },
    include: {
      answers: { where: { sync_status: "PENDING_PUSH" } },
      quiz:    { select: { server_id: true } },
    },
  });

  let pushed = 0;
  let conflicts = 0;

  for (const attempt of pendingAttempts) {
    try {
      if (!attempt.quiz.server_id) {
        emitter.emit("progress", {
          step: "PUSH_ERROR", entity: "attempt", localId: attempt.id,
          error: "Parent quiz not yet synced — will retry next sync",
        });
        continue;
      }

      let moodleAttemptId = attempt.server_id;
      let shouldPush = true;

      if (!moodleAttemptId) {
        // Entité créée hors ligne — diagnoseLocalOnly confirme PUSH
        // eslint-disable-next-line no-unused-vars
        const action = diagnoseLocalOnly(); // SyncCase.PUSH — toujours
        // Pas besoin de vérifier le conflit, cette entité n'existe pas encore sur le serveur

        const { data: startData } = await moodleFetch(
          "mod_quiz_start_attempt",
          { quizid: attempt.quiz.server_id },
          token
        );
        moodleAttemptId = startData.attempt.id;
        await prisma.quizAttempt.update({
          where: { id: attempt.id },
          data:  { server_id: moodleAttemptId },
        });

      } else {
        // Entité déjà synced puis modifiée localement → vérifier conflit
        const { data: serverData } = await moodleFetch(
          "mod_quiz_get_user_attempts",
          { quizid: attempt.quiz.server_id, status: "all" },
          token
        );

        const serverAttempt = serverData.attempts?.find((a) => a.id === moodleAttemptId);

        if (serverAttempt) {
          const serverChanged = serverAttempt.timemodified > (attempt.server_timemodified ?? 0);

          if (serverChanged) {
            const resolution = resolveConflict("quiz_attempt"); // CLIENT gagne → PUSH
            conflicts++;
            emitter.emit("progress", {
              step: "CONFLICT", entity: "attempt",
              localId: attempt.id, serverId: moodleAttemptId,
              resolution,
            });

            if (resolution === SyncCase.PULL) {
              // Le serveur gagne — on ne pousse pas, le pull s'en chargera
              shouldPush = false;
            }
          }
        }
      }

      if (!shouldPush) continue;

      // Envoyer les réponses si présentes
      if (attempt.answers.length > 0) {
        const answerData = [];
        for (const answer of attempt.answers) {
          const question = await prisma.quizQuestion.findUnique({
            where: { id: answer.questionId },
          });
          if (!question) continue;
          answerData.push({
            name:  `q${question.slot}:1_answer`,
            value: answer.responseText ?? "",
          });
        }

        const finishAttempt = attempt.state === "SUBMITTED" ? 1 : 0;

        await moodleFetch("mod_quiz_process_attempt", {
          attemptid:     moodleAttemptId,
          data:          answerData,
          finishattempt: finishAttempt,
        }, token);

        await prisma.quizAnswer.updateMany({
          where: { attemptId: attempt.id, sync_status: "PENDING_PUSH" },
          data:  { sync_status: "SYNCED" },
        });
      }

      await prisma.quizAttempt.update({
        where: { id: attempt.id },
        data:  { server_id: moodleAttemptId, sync_status: "SYNCED" },
      });

      pushed++;
      emitter.emit("progress", {
        step: "PUSH", entity: "attempt",
        localId: attempt.id, serverId: moodleAttemptId,
      });

    } catch (err) {
      emitter.emit("progress", {
        step: "PUSH_ERROR", entity: "attempt",
        localId: attempt.id, error: err.message,
      });
    }
  }

  emitter.emit("progress", { step: "PUSH", entity: "attempts", status: "done", pushed });
  return { pushed, conflicts };
};