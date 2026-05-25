// src/sync/pull/pullFolderResources.js
import { moodleFetch } from "../../config/moodleApi.js";
import { diagnose, diagnoseNew, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pullFolderResources = async ({ prisma, token, cursor, servertime, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "folder_resources", status: "start" });

  const enrollments = await prisma.courseEnrollment.findMany({ where: { syncEnabled: true } });
  const courseIds = enrollments.map(e => e.courseServerId);
  if (courseIds.length === 0) return { pulled: 0, conflicts: 0 };

  let pulled = 0;
  let conflicts = 0;

  // 1. Récupération des métadonnées des dossiers (pour avoir le timemodified)
  const { data: result } = await moodleFetch("mod_folder_get_folders_by_courses", { courseids: courseIds }, token);
  const folders = result.folders || [];

  // Cache en mémoire pour stocker les structures de cours et éviter les requêtes réseau doublons
  const courseContentsCache = {};

  for (const folder of folders) {
    const serverTimemodified = folder.timemodified ?? 0;
    
    // Trouver le module parent préalablement créé par pullCourseStructure
    const parentModule = await prisma.module.findUnique({ where: { server_id: folder.coursemodule } });
    if (!parentModule) continue;

    const local = await prisma.folderResource.findFirst({ where: { server_id: folder.id } });
    let action = local ? diagnose(local, serverTimemodified, cursor) : diagnoseNew();

    if (action === SyncCase.CONFLICT) {
      action = resolveConflict("folder_resource"); // Le serveur gagne sur la structure (PULL)
      conflicts++;
    }

    if (action === SyncCase.PULL) {
      // 2. Upsert du conteneur Dossier
      const savedFolder = await prisma.folderResource.upsert({
        where:  { server_id: folder.id },
        update: {
          moduleId:            parentModule.id,
          name:                folder.name,
          intro:               folder.intro ? _stripHtml(folder.intro) : null,
          server_timemodified: serverTimemodified,
          sync_status:         "SYNCED",
          last_synced_at:      servertime,
        },
        create: {
          moduleId:            parentModule.id,
          server_id:           folder.id,
          name:                folder.name,
          intro:               folder.intro ? _stripHtml(folder.intro) : null,
          server_timemodified: serverTimemodified,
          sync_status:         "SYNCED",
          last_synced_at:      servertime,
        },
      });
      pulled++;

      // 3. Récupération des fichiers contenus dans ce dossier via le cache
      const courseId = folder.course;
      if (!courseContentsCache[courseId]) {
        // Si la structure du cours n'est pas encore en cache, on la fetch
        const { data: courseContents } = await moodleFetch(
          "core_course_get_contents", 
          { courseid: courseId }, 
          token
        );
        courseContentsCache[courseId] = courseContents || [];
      }

      // Recherche du module correspondant dans le cache du cours
      let folderContents = [];
      for (const section of courseContentsCache[courseId]) {
        const mod = (section.modules || []).find(m => m.id === folder.coursemodule);
        if (mod) {
          folderContents = mod.contents || [];
          break;
        }
      }

      // 4. Génération des LocalFile pour les fichiers à l'intérieur du dossier
      for (const f of folderContents) {
        if (!f.fileurl || f.type !== "file") continue; // On ignore les sous-dossiers virtuels

        await prisma.localFile.upsert({
          where: { moodleUrl: f.fileurl }, // Grâce à votre ajout du @unique, c'est parfait !
          update: {
            folderResourceId:    savedFolder.id,
            filename:            f.filename,
            mimeType:            f.mimetype ?? null,
            fileSize:            f.filesize ?? null,
            server_timemodified: serverTimemodified, // On hérite du timemodified du dossier
            last_synced_at:      servertime,
          },
          create: {
            folderResourceId:    savedFolder.id,
            filename:            f.filename,
            moodleUrl:           f.fileurl,
            mimeType:            f.mimetype ?? null,
            fileSize:            f.filesize ?? null,
            sync_status:         "SYNCED",
            server_timemodified: serverTimemodified,
            last_synced_at:      servertime,
          }
        });
      }
    }
  }

  emitter.emit("progress", { step: "PULL", entity: "folder_resources", status: "done", pulled, conflicts });
  return { pulled, conflicts };
};

const _stripHtml = (str) => str ? str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null : null;