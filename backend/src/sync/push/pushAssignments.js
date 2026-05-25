// src/sync/push/pushAssignments.js
// Pousse les soumissions de devoirs hors ligne vers Moodle.
// Propriétaire : CLIENT — le devoir rendu par l'étudiant gagne toujours.
//
// Deux cas :
//   server_id === null → créée hors ligne (diagnoseLocalOnly → PUSH direct)
//   server_id !== null → modifiée après sync → vérifier conflit avant push

import { moodleFetch } from "../../config/moodleApi.js";
import { diagnoseLocalOnly, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pushAssignments = async ({ prisma, token, moodleUserId, emitter }) => {
  emitter.emit("progress", { step: "PUSH", entity: "submissions", status: "start" });

  const pendingSubmissions = await prisma.assignmentSubmission.findMany({
    where:   { sync_status: "PENDING_PUSH" },
    include: { assignment: { select: { server_id: true, name: true } } },
  });

  let pushed = 0;
  let conflicts = 0;

  for (const submission of pendingSubmissions) {
    try {
      if (!submission.assignment.server_id) {
        emitter.emit("progress", {
          step: "PUSH_ERROR", entity: "submission", localId: submission.id,
          error: "Parent assignment not yet synced — will retry next sync",
        });
        continue;
      }

      let shouldPush = true;

      if (!submission.server_id) {
        // Nouvelle soumission hors ligne — diagnoseLocalOnly confirme PUSH direct
        // eslint-disable-next-line no-unused-vars
        const action = diagnoseLocalOnly(); // SyncCase.PUSH — toujours

      } else {
        // Soumission déjà synced puis modifiée → vérifier conflit
        const { data: serverData } = await moodleFetch(
          "mod_assign_get_submissions",
          { assignmentids: [submission.assignment.server_id] },
          token
        );

        const serverSubmissions = serverData.assignments?.[0]?.submissions ?? [];
        const serverSubmission = serverSubmissions.find(s => s.id === submission.server_id && s.userid === moodleUserId);

        if (serverSubmission) {
          const serverChanged = serverSubmission.timemodified > (submission.server_timemodified ?? 0);

          if (serverChanged) {
            const resolution = resolveConflict("assignment_submission"); // CLIENT gagne → PUSH
            conflicts++;
            emitter.emit("progress", {
              step: "CONFLICT", entity: "submission",
              localId: submission.id, serverId: submission.server_id,
              resolution,
            });

            if (resolution === SyncCase.PULL) {
              shouldPush = false;
            }
          }
        }
      }

      if (!shouldPush) continue;

      // Sauvegarder le texte sur Moodle
      await moodleFetch("mod_assign_save_submission", {
        assignmentid: submission.assignment.server_id,
        plugindata: {
          onlinetext_editor: {
            text:   submission.submissionText ?? "",
            format: 1,
            itemid: 0,
          },
        },
      }, token);

      // Soumettre définitivement si SUBMITTED
      if (submission.state === "SUBMITTED") {
        await moodleFetch("mod_assign_submit_for_grading", {
          assignmentid:              submission.assignment.server_id,
          acceptsubmissionstatement: 1,
        }, token);
      }

      // Récupérer le server_id et timemodified de la soumission créée/mise à jour
      const { data: updatedData } = await moodleFetch(
        "mod_assign_get_submissions",
        { assignmentids: [submission.assignment.server_id] },
        token
      );

      const moodleSubmissions = updatedData.assignments?.[0]?.submissions ?? [];
      const moodleSubmission = moodleSubmissions.find(s => s.userid === moodleUserId);

      await prisma.assignmentSubmission.update({
        where: { id: submission.id },
        data: {
          server_id:           moodleSubmission?.id ?? null,
          sync_status:         "SYNCED",
          server_timemodified: moodleSubmission?.timemodified ?? null,
          last_synced_at:      moodleSubmission?.timemodified ?? null,
        },
      });

      pushed++;
      emitter.emit("progress", {
        step: "PUSH", entity: "submission",
        localId: submission.id, serverId: moodleSubmission?.id,
      });

    } catch (err) {
      emitter.emit("progress", {
        step: "PUSH_ERROR", entity: "submission",
        localId: submission.id, error: err.message,
      });
    }
  }

  emitter.emit("progress", { step: "PUSH", entity: "submissions", status: "done", pushed });
  return { pushed, conflicts };
};