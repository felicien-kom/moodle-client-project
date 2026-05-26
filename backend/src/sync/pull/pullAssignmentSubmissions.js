// src/sync/pull/pullAssignmentSubmissions.js
import { moodleFetch } from "../../config/moodleApi.js";
import { diagnose, diagnoseNew, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pullAssignmentSubmissions = async ({ prisma, token, cursor, servertime, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "submissions", status: "start" });

  const assignments = await prisma.assignment.findMany();
  let pulled = 0, conflicts = 0;

  for (const assign of assignments) {
    try {
      const { data: result } = await moodleFetch("mod_assign_get_submission_status", { assignid: assign.server_id }, token);
      
      const lastAttempt = result.lastattempt;
      if (!lastAttempt || !lastAttempt.submission) continue;

      const sub = lastAttempt.submission;

      // ─── CORRECTION ICI ──────────────────────────────────────────
      // Si le statut est "new", l'étudiant n'a jamais touché au devoir sur le serveur.
      // On ne crée pas de soumission locale inutilement.
      if (sub.status === "new") {
        continue; 
      }
      // ─────────────────────────────────────────────────────────────

      const serverTimemodified = sub.numcreated ?? sub.timemodified ?? 0;
      
      // Extraction du texte et des fichiers
      const textPlugin = sub.plugins?.find(p => p.type === "onlinetext");
      const submissionText = textPlugin?.editorfields?.[0]?.text || null;
      
      const filePlugin = sub.plugins?.find(p => p.type === "file");
      const submittedFiles = filePlugin?.fileareas?.[0]?.files || [];

      // Moodle state: "new", "draft", "submitted"
      const state = sub.status === "submitted" ? "SUBMITTED" : "DRAFT";

      const local = await prisma.assignmentSubmission.findFirst({ where: { assignmentId: assign.id } });
      let action = local ? diagnose(local, serverTimemodified, cursor) : diagnoseNew();

      if (action === SyncCase.CONFLICT) {
        action = resolveConflict("assignment_submission"); // CLIENT gagne (l'étudiant ne perd pas son travail hors-ligne)
        conflicts++;
      }

      if (action === SyncCase.PULL) {
        const savedSub = await prisma.assignmentSubmission.upsert({
          where: { id: local?.id || -1 },
          update: {
            attemptNumber:       lastAttempt.attemptnumber ?? 0,
            submissionText,
            state,
            server_id:           sub.id,
            server_timemodified: serverTimemodified,
            sync_status:         "SYNCED",
            last_synced_at:      servertime,
          },
          create: {
            assignmentId:        assign.id,
            attemptNumber:       lastAttempt.attemptnumber ?? 0,
            submissionText,
            state,
            server_id:           sub.id,
            server_timemodified: serverTimemodified,
            sync_status:         "SYNCED",
            last_synced_at:      servertime,
          }
        });
        pulled++;

        // Fichiers déjà soumis sur Moodle
        for (const f of submittedFiles) {
          if (!f.fileurl) continue;
          await prisma.localFile.upsert({
            where: { moodleUrl: f.fileurl },
            update: { submissionId: savedSub.id, filename: f.filename, server_timemodified: serverTimemodified },
            create: { submissionId: savedSub.id, filename: f.filename, moodleUrl: f.fileurl, sync_status: "SYNCED" }
          });
        }
      }
    } catch (err) {
      // Ignore si le devoir n'est pas accessible
    }
  }

  emitter.emit("progress", { step: "PULL", entity: "submissions", status: "done", pulled });
  return { pulled, conflicts };
};