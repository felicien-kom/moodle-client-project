// src/sync/push/pushCourseModules.js
import fs from "fs";
import path from "path";
import { moodleFetch } from "../../config/moodleApi.js";
import { env } from "../../config/env.js";
import { getUserMediaDir } from "../../utils/storage.js";

export const pushCourseModules = async ({ prisma, token, emitter }) => {
  emitter.emit("progress", { step: "PUSH", entity: "modules", status: "start" });

  const user = await prisma.localUser.findFirst();
  if (!user) return { pushed: 0, conflicts: 0 };

  // On récupère les modules créés en local (server_id null) ou modifiés (PENDING_PUSH)
  const pendingModules = await prisma.module.findMany({
    where: { sync_status: "PENDING_PUSH" },
    include: {
      course: true,
      section: true,
      fileResources: { include: { files: true } },
      folderResources: { include: { files: true } },
      assignments: { include: { introFiles: true } },
      externalUrls: true
    }
  });

  let pushed = 0;
  let conflicts = 0; // Pour l'instant pas de conflits complexes gérés ici car ce sont des créations (server_id est null)

  for (const module of pendingModules) {
    try {
      if (!module.course.server_id) {
        emitter.emit("progress", {
          step: "PUSH_ERROR", entity: "module", localId: module.id,
          error: "Le cours parent n'est pas synchronisé avec le serveur."
        });
        continue;
      }

      // Déterminer l'activité associée et ses fichiers locaux
      let activity = null;
      let localFiles = [];
      
      if (module.modType === "assign") {
        activity = module.assignments[0];
        localFiles = activity?.introFiles || [];
      } else if (module.modType === "resource") {
        activity = module.fileResources[0];
        localFiles = activity?.files || [];
      } else if (module.modType === "folder") {
        activity = module.folderResources[0];
        localFiles = activity?.files || [];
      } else if (module.modType === "url") {
        activity = module.externalUrls[0];
      }

      if (!activity) {
        throw new Error(`Aucune activité fille trouvée pour le module ${module.id} de type ${module.modType}`);
      }

      // ─── ÉTAPE 1 : UPLOAD DES FICHIERS (DRAFT AREA MOODLE) ──────────────
      let draftItemId = 0;

      if (localFiles.length > 0) {
        const baseDir = getUserMediaDir(user.email);

        for (const file of localFiles) {
          if (!file.localPath) continue;
          
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

      // ─── ÉTAPE 2 : APPEL DU PLUGIN PHP LOCAL ───────────────────────
      const options = [];

      if (draftItemId !== 0) {
        if (module.modType === "assign") {
          options.push({ name: "introattachments", value: String(draftItemId) });
        } else {
          // Standard behaviour for resources and folders in Moodle
          options.push({ name: "files", value: String(draftItemId) });
          options.push({ name: "display", value: "0" });
        }
      }

      if (module.modType === "assign") {
        options.push({ name: "submissiondrafts", value: "0" });
        options.push({ name: "duedate", value: "0" });
        options.push({ name: "allowsubmissionsfromdate", value: "0" });
        options.push({ name: "grade", value: "100" });
        options.push({ name: "completionsubmit", value: "0" });
      }

      if (module.modType === "url" && activity.externalUrl) {
        options.push({ name: "externalurl", value: activity.externalUrl });
      }

      const pluginParams = {
        courseid: module.course.server_id,
        sectionnum: module.section?.sectionIndex || 0, 
        modname: module.modType,
        name: activity.name,
        intro: activity.intro || activity.description || "",
        options: options
      };

      const { data: serverResponse, servertime } = await moodleFetch(
        "local_offline_sync_create_module",
        pluginParams,
        token
      );

      // Le plugin devrait renvoyer l'ID du cours module (cmid) et l'ID de l'instance
      // ex: { cmid: 123, instanceid: 456 }
      if (!serverResponse || !serverResponse.cmid) {
        throw new Error("Le plugin n'a pas renvoyé le cmid attendu.");
      }

      // ─── ÉTAPE 3 : MISE À JOUR DE LA BD LOCALE ──────────────
      // Update module
      await prisma.module.update({
        where: { id: module.id },
        data: {
          server_id: serverResponse.cmid,
          sync_status: "SYNCED",
          server_timemodified: servertime,
          last_synced_at: servertime,
        }
      });

      // Update activity
      const activityDataToUpdate = {
        server_id: serverResponse.instanceid || undefined, // si retourné par le plugin
        sync_status: "SYNCED",
        server_timemodified: servertime,
        last_synced_at: servertime,
      };

      if (module.modType === "assign") {
        await prisma.assignment.update({ where: { id: activity.id }, data: activityDataToUpdate });
      } else if (module.modType === "resource") {
        await prisma.fileResource.update({ where: { id: activity.id }, data: activityDataToUpdate });
      } else if (module.modType === "folder") {
        await prisma.folderResource.update({ where: { id: activity.id }, data: activityDataToUpdate });
      } else if (module.modType === "url") {
        await prisma.externalUrl.update({ where: { id: activity.id }, data: activityDataToUpdate });
      }

      // Update files
      if (localFiles.length > 0) {
        await prisma.localFile.updateMany({
          where: { id: { in: localFiles.map(f => f.id) } },
          data: {
            sync_status: "SYNCED",
            server_timemodified: servertime,
            last_synced_at: servertime
          }
        });
      }

      pushed++;
      emitter.emit("progress", { step: "PUSH", entity: "module", localId: module.id });

    } catch (err) {
      console.error(`Error pushing module ${module.id}:`, err);
      emitter.emit("progress", {
        step: "PUSH_ERROR", entity: "module",
        localId: module.id, error: err.message,
      });
    }
  }

  emitter.emit("progress", { step: "PUSH", entity: "modules", status: "done", pushed });
  return { pushed, conflicts };
};
