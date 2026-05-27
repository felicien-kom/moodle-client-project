// src/sync/push/pushAssignments.js
import fs from "fs";
import path from "path";
import { moodleFetch } from "../../config/moodleApi.js";
import { env } from "../../config/env.js"; // Pour avoir l'URL de base Moodle
import { diagnoseLocalOnly, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";
import { getUserMediaDir } from "../../utils/storage.js";

export const pushAssignmentSubmissions = async ({ prisma, token, emitter }) => {
  emitter.emit("progress", { step: "PUSH", entity: "submissions", status: "start" });

  // On a besoin de l'utilisateur pour localiser son dossier media
  const user = await prisma.localUser.findFirst();
  if (!user) return { pushed: 0, conflicts: 0 };

  // On récupère toutes les soumissions en attente de PUSH, AVEC leurs fichiers liés
  const pendingSubmissions = await prisma.assignmentSubmission.findMany({
    where:   { sync_status: "PENDING_PUSH" },
    include: { 
      assignment: { select: { server_id: true, name: true } },
      submittedFiles: true // Les fichiers locaux fraîchement créés
    },
  });

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
        // Le devoir existait déjà sur Moodle. On vérifie s'il a été modifié là-bas.
        const { data: serverData } = await moodleFetch(
          "mod_assign_get_submission_status",
          { assignid: submission.assignment.server_id },
          token
        );
        
        const serverSub = serverData.lastattempt?.submission;
        const serverTimemodified = serverSub?.timemodified ?? 0;

        // Si le serveur est plus récent que notre dernier PULL
        if (serverSub && serverTimemodified > (submission.server_timemodified ?? 0)) {
          const resolution = resolveConflict("assignment_submission"); // CLIENT gagne toujours !
          conflicts++;
          emitter.emit("progress", {
            step: "CONFLICT", entity: "submission",
            localId: submission.id, resolution,
          });

          if (resolution === SyncCase.PULL) shouldPush = false; // Par sécurité, bien que ça n'arrivera pas
        }
      }

      if (!shouldPush) continue;

      // ─── ÉTAPE 2 : UPLOAD DES FICHIERS (DRAFT AREA MOODLE) ──────────────
      let draftItemId = 0; // 0 indique à Moodle de créer une nouvelle zone

      if (submission.submittedFiles.length > 0) {
        const baseDir = getUserMediaDir(user.email); // Pointe sur data/media/email/

        for (const file of submission.submittedFiles) {
          const fullPath = path.join(baseDir, file.localPath); // Résout avec "submissions/..."

          if (!fs.existsSync(fullPath)) {
            console.warn(`[SYNC WARNING] Fichier local introuvable: ${fullPath}`);
            continue;
          }

          // Construction du FormData compatible Node.js 18+
          const fileBuffer = fs.readFileSync(fullPath);
          const blob = new Blob([fileBuffer], { type: file.mimeType || "application/octet-stream" });
          
          const formData = new FormData();
          formData.append("token", token);
          formData.append("itemid", draftItemId); // On passe l'itemid (0 au 1er, puis celui de Moodle)
          formData.append("filearea", "draft");
          formData.append("file", blob, file.filename);

          // L'appel se fait sur upload.php, PAS server.php
          // Assurez-vous que env.MOODLE_URL ne se termine pas par un slash
          const uploadUrl = `${env.MOODLE_URL}/webservice/upload.php`;
          
          const uploadRes = await fetch(uploadUrl, { method: "POST", body: formData });
          if (!uploadRes.ok) throw new Error(`Erreur réseau upload.php: HTTP ${uploadRes.status}`);

          const uploadData = await uploadRes.json();

          if (uploadData.errorcode) {
             throw new Error(`Moodle Upload Error: ${uploadData.error}`);
          }

          // Moodle renvoie un tableau contenant le nouvel itemid
          if (Array.isArray(uploadData) && uploadData[0]?.itemid) {
            draftItemId = uploadData[0].itemid;
          }
        }
      }

      // ─── ÉTAPE 3 : SAUVEGARDE DU DEVOIR SUR MOODLE ───────────────────────
      const pluginData = {
        onlinetext_editor: {
          text:   submission.submissionText ?? "",
          format: 1, // 1 = Format HTML standard
          itemid: 0,
        }
      };

      // Si des fichiers ont été uploadés, on attache l'ID de la zone de brouillon
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
          acceptsubmissionstatement: 1, // On accepte la charte anti-plagiat si elle existe
        }, token);
      }

      // ─── ÉTAPE 5 : MISE À JOUR DE LA BD LOCALE APRÈS SUCCÈS ──────────────
      // On re-télécharge le statut exact depuis Moodle pour avoir les bons timestamps officiels
      const { data: updatedStatus } = await moodleFetch(
        "mod_assign_get_submission_status",
        { assignid: submission.assignment.server_id },
        token
      );

      const moodleSub = updatedStatus.lastattempt?.submission;
      const newServerTime = moodleSub?.timemodified ?? Math.floor(Date.now() / 1000);

      // 5A. On met à jour la soumission
      await prisma.assignmentSubmission.update({
        where: { id: submission.id },
        data: {
          server_id:           moodleSub?.id ?? submission.server_id,
          sync_status:         "SYNCED",
          server_timemodified: newServerTime,
          last_synced_at:      newServerTime,
        },
      });

      // 5B. On marque tous les fichiers associés comme synchronisés
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