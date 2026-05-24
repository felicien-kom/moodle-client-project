// src/sync/pull/pullExternalUrls.js
import { moodleFetch } from "../../config/moodleApi.js";
import { diagnose, diagnoseNew, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pullExternalUrls = async ({ prisma, token, cursor, servertime, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "external_urls", status: "start" });

  const enrollments = await prisma.courseEnrollment.findMany({ where: { syncEnabled: true } });
  const courseIds = enrollments.map(e => e.courseServerId);
  if (courseIds.length === 0) return { pulled: 0, conflicts: 0 };

  let pulled = 0;
  let conflicts = 0;

  const { data: result } = await moodleFetch("mod_url_get_urls_by_courses", { courseids: courseIds }, token);
  const urls = result.urls || [];

  for (const urlData of urls) {
    const serverTimemodified = urlData.timemodified ?? 0;
    const parentModule = await prisma.module.findUnique({ where: { server_id: urlData.coursemodule } });
    if (!parentModule) continue;

    const local = await prisma.externalUrl.findFirst({ where: { server_id: urlData.id } });
    let action = local ? diagnose(local, serverTimemodified, cursor) : diagnoseNew();

    if (action === SyncCase.CONFLICT) action = resolveConflict("module"); // SERVER gagne

    if (action === SyncCase.PULL) {
      await prisma.externalUrl.upsert({
        where:  { server_id: urlData.id },
        update: {
          moduleId:            parentModule.id,
          name:                urlData.name,
          externalUrl:         urlData.externalurl,
          description:         urlData.intro ? _stripHtml(urlData.intro) : null,
          server_timemodified: serverTimemodified,
          sync_status:         "SYNCED",
          last_synced_at:      servertime,
        },
        create: {
          moduleId:            parentModule.id,
          server_id:           urlData.id,
          name:                urlData.name,
          externalUrl:         urlData.externalurl,
          description:         urlData.intro ? _stripHtml(urlData.intro) : null,
          server_timemodified: serverTimemodified,
          sync_status:         "SYNCED",
          last_synced_at:      servertime,
        },
      });
      pulled++;
    }
  }

  emitter.emit("progress", { step: "PULL", entity: "external_urls", status: "done", pulled });
  return { pulled, conflicts };
};

const _stripHtml = (str) => str ? str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null : null;