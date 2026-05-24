// src/sync/pull/pullProfile.js
import { moodleFetch } from "../../config/moodleApi.js";
import { diagnose, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pullProfile = async ({ prisma, token, userId, cursor, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "profile", status: "start" });

  const { data: siteInfo, servertime } = await moodleFetch(
    "core_webservice_get_site_info",
    {},
    token
  );

  const local = await prisma.localUser.findFirst({ where: { id: userId } });
  if (!local) {
    emitter.emit("progress", { step: "PULL", entity: "profile", status: "done", pulled: 0 });
    return { pulled: 0, conflicts: 0 };
  }

  let action = diagnose(local, servertime, cursor);
  let conflicts = 0;

  if (action === SyncCase.CONFLICT) {
    action = resolveConflict("profile"); // CLIENT gagne
    conflicts = 1;
    emitter.emit("progress", { step: "CONFLICT", entity: "profile", resolution: action });
  }

  let pulled = 0;

  if (action === SyncCase.PULL) {
    // Éviter la réécriture si les informations fondamentales restent inchangées
    const profileChanged = 
      local.name !== siteInfo.fullname || 
      local.moodleUserId !== siteInfo.userid;

    if (profileChanged) {
      await prisma.localUser.update({
        where: { id: userId },
        data: {
          name:                siteInfo.fullname,
          moodleUserId:        siteInfo.userid,
          server_timemodified: servertime,
          sync_status:         "SYNCED",
          last_synced_at:      servertime,
        },
      });
      pulled = 1;
    }
  }

  emitter.emit("progress", { step: "PULL", entity: "profile", status: "done", pulled, conflicts });
  return { pulled, conflicts };
};