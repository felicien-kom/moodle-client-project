// src/sync/push/pushAssignmentSubmissions.js
import fs from "fs";
import path from "path";
import { moodleFetch } from "../../config/moodleApi.js";
import { env } from "../../config/env.js"; 
import { diagnoseLocalOnly, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";
import { getUserMediaDir } from "../../utils/storage.js";

export const pushAssignmentSubmissions = async ({ prisma, token, emitter }) => {
  emitter.emit("progress", { step: "PUSH", entity: "submissions", status: "start" });

  const user = await prisma.localUser.findFirst();
  if (!user) return { pushed: 0, conflicts: 0 };

  // ─── SÉCURITÉ AJOUTÉE ICI ──────────────────────────────────────────────
  // On s'assure de ne pousser QUE les copies appartenant à l'utilisateur connecté
  // et UNIQUEMENT s'il s'agit d'un travail (DRAFT/SUBMITTED), pas d'une correction (GRADED).
  const pendingSubmissions = await prisma.assignmentSubmission.findMany({
    where:   { 
      sync_status: "PENDING_PUSH",
      moodleUserId: user.moodleUserId,           // <-- Sécurité 1 : Mes copies
      state: { in: ["DRAFT", "SUBMITTED"] }      // <-- Sécurité 2 : Pas de notes
    },
    include: { 
      assignment: { select: { server_id: true, name: true } },
      submittedFiles: true 
    },
  });
  // ────────────────────────────────────────────────────────────────────────

  let pushed = 0;
  let conflicts = 0;

  for (const submission of pendingSubmissions) {
    try {
      if (!submission.assignment.server_id) {
        emitter.emit("progress", {
          step: "PUSH_ERROR", entity: "submission", localId: submission.id,
          error: "Le devoir parent n'est pas encore synchronisé avec le serveur.",
        });
        continue;
      }

      // ─── ÉTAPE 1 : RÉSOLUTION DES CONFLITS ──────────────────────────────
      let shouldPush = true;

      if (submission.server_id) {
        // Comme c'est filtré sur l'utilisateur courant, cet appel Moodle renverra bien SA copie
        const { data: serverData } = await moodleFetch(
          "mod_assign_get_submission_status",
          { assignid: submission.assignment.server_id },
          token
        );
        
        const serverSub = serverData.lastattempt?.submission;
        const serverTimemodified = serverSub?.timemodified ?? 0;

        if (serverSub && serverTimemodified > (submission.server_timemodified ?? 0)) {
          const resolution = resolveConflict("assignment_submission"); 
          conflicts++;
          emitter.emit("progress", {
            step: "CONFLICT", entity: "submission",
            localId: submission.id, resolution,
          });

          if (resolution === SyncCase.PULL) shouldPush = false; 
        }
      }

      if (!shouldPush) continue;

      // ─── ÉTAPE 2 : UPLOAD DES FICHIERS (DRAFT AREA MOODLE) ──────────────
      let draftItemId = 0; 

      if (submission.submittedFiles.length > 0) {
        const baseDir = getUserMediaDir(user.email); 

        for (const file of submission.submittedFiles) {
          const fullPath = path.join(baseDir, file.localPath); 

          if (!fs.existsSync(fullPath)) {
            console.warn(`[SYNC WARNING] Fichier local introuvable: ${fullPath}`);
            continue;
          }

          const fileBuffer = fs.readFileSync(fullPath);
          const blob = new Blob([fileBuffer], { type: file.mimeType || "application/octet-stream" });
          
          const formData = new FormData();
          formData.append("token", token);
          formData.append("itemid", draftItemId); 
          formData.append("filearea", "draft");
          formData.append("file", blob, file.filename);

          const uploadUrl = `${env.MOODLE_URL}/webservice/upload.php`;
          
          const uploadRes = await fetch(uploadUrl, { method: "POST", body: formData });
          if (!uploadRes.ok) throw new Error(`Erreur réseau upload.php: HTTP ${uploadRes.status}`);

          const uploadData = await uploadRes.json();

          if (uploadData.errorcode) {
             throw new Error(`Moodle Upload Error: ${uploadData.error}`);
          }

          if (Array.isArray(uploadData) && uploadData[0]?.itemid) {
            draftItemId = uploadData[0].itemid;
          }
        }
      }

      // ─── ÉTAPE 3 : SAUVEGARDE DU DEVOIR SUR MOODLE ───────────────────────
      const pluginData = {
        onlinetext_editor: {
          text:   submission.submissionText ?? "",
          format: 1, 
          itemid: 0,
        }
      };

      if (draftItemId !== 0) {
        pluginData.files_filemanager = draftItemId;
      }

      await moodleFetch("mod_assign_save_submission", {
        assignmentid: submission.assignment.server_id,
        plugindata: pluginData
      }, token);

      // ─── ÉTAPE 4 : VERROUILLAGE DÉFINITIF (SI SUBMITTED) ─────────────────
      if (submission.state === "SUBMITTED") {
        await moodleFetch("mod_assign_submit_for_grading", {
          assignmentid: submission.assignment.server_id,
          acceptsubmissionstatement: 1, 
        }, token);
      }

      // ─── ÉTAPE 5 : MISE À JOUR DE LA BD LOCALE APRÈS SUCCÈS ──────────────
      const { data: updatedStatus } = await moodleFetch(
        "mod_assign_get_submission_status",
        { assignid: submission.assignment.server_id },
        token
      );

      const moodleSub = updatedStatus.lastattempt?.submission;
      const newServerTime = moodleSub?.timemodified ?? Math.floor(Date.now() / 1000);

      await prisma.assignmentSubmission.update({
        where: { id: submission.id },
        data: {
          server_id:           moodleSub?.id ?? submission.server_id,
          sync_status:         "SYNCED",
          server_timemodified: newServerTime,
          last_synced_at:      newServerTime,
        },
      });

      if (submission.submittedFiles.length > 0) {
        await prisma.localFile.updateMany({
          where: { submissionId: submission.id },
          data:  { 
            sync_status:         "SYNCED", 
            server_timemodified: newServerTime,
            last_synced_at:      newServerTime
          }
        });
      }

      pushed++;
      emitter.emit("progress", { step: "PUSH", entity: "submission", localId: submission.id });

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