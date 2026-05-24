// src/sync/pull/pullFileResources.js
import { moodleFetch } from "../../config/moodleApi.js";
import { diagnose, diagnoseNew, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pullFileResources = async ({ prisma, token, cursor, servertime, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "file_resources", status: "start" });

  const enrollments = await prisma.courseEnrollment.findMany({ where: { syncEnabled: true } });
  const courseIds = enrollments.map(e => e.courseServerId);
  if (courseIds.length === 0) return { pulled: 0, conflicts: 0 };

  let pulled = 0;
  let conflicts = 0;

  // On demande à Moodle TOUTES les ressources de tous nos cours en une seule requête !
  const { data: result } = await moodleFetch("mod_resource_get_resources_by_courses", { courseids: courseIds }, token);
  const resources = result.resources || [];

  for (const res of resources) {
    const serverTimemodified = res.timemodified ?? 0;
    
    // Trouver le module parent préalablement créé par pullCourseStructure
    const parentModule = await prisma.module.findUnique({ where: { server_id: res.coursemodule } });
    if (!parentModule) continue;

    const local = await prisma.fileResource.findFirst({ where: { server_id: res.id } });
    let action = local ? diagnose(local, serverTimemodified, cursor) : diagnoseNew();

    if (action === SyncCase.CONFLICT) {
      action = resolveConflict("module"); // SERVER gagne -> PULL
      conflicts++;
    }

    if (action === SyncCase.PULL) {
      const savedResource = await prisma.fileResource.upsert({
        where:  { server_id: res.id },
        update: {
          moduleId:            parentModule.id,
          name:                res.name,
          intro:               res.intro ? _stripHtml(res.intro) : null,
          server_timemodified: serverTimemodified,
          sync_status:         "SYNCED",
          last_synced_at:      servertime,
        },
        create: {
          moduleId:            parentModule.id,
          server_id:           res.id,
          name:                res.name,
          intro:               res.intro ? _stripHtml(res.intro) : null,
          server_timemodified: serverTimemodified,
          sync_status:         "SYNCED",
          last_synced_at:      servertime,
        },
      });
      pulled++;

      // Génération des LocalFile en mode "Deferred Download"
      const files = res.contentfiles || [];
      for (const f of files) {
        if (!f.fileurl) continue;

        // Upsert basé sur l'URL unique du fichier
        await prisma.localFile.upsert({
          where: { moodleUrl: f.fileurl }, // /!\ Assurez-vous d'ajouter @unique sur moodleUrl dans votre Prisma schema /!\
          update: {
            fileResourceId:      savedResource.id,
            filename:            f.filename,
            mimeType:            f.mimetype ?? null,
            fileSize:            f.filesize ?? null,
            server_timemodified: serverTimemodified,
            last_synced_at:      servertime,
          },
          create: {
            fileResourceId:      savedResource.id,
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

  emitter.emit("progress", { step: "PULL", entity: "file_resources", status: "done", pulled, conflicts });
  return { pulled, conflicts };
};

const _stripHtml = (str) => str ? str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null : null;