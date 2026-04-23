// src/sync/pull/pullProfile.js
import { moodleFetch } from "../../config/moodleApi.js";
import { diagnose, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pullProfile = async ({ prisma, token, userId, cursor, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "profile", status: "start" });

  // core_webservice_get_site_info valide le token et retourne les infos utilisateur
  // Le servertime vient du header Date de la réponse (déjà extrait par moodleFetch)
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
    action = resolveConflict("profile"); // CLIENT gagne → PUSH, on ne pull pas
    conflicts = 1;
    emitter.emit("progress", { step: "CONFLICT", entity: "profile", resolution: action });
  }

  let pulled = 0;

  if (action === SyncCase.PULL) {
    await prisma.localUser.update({
      where: { id: userId },
      data: {
        name:                siteInfo.fullname,
        moodleUserId:        siteInfo.userid,
        server_id:           siteInfo.userid,
        server_timemodified: servertime,
        sync_status:         "SYNCED",
        last_synced_at:      servertime,
      },
    });
    pulled = 1;
  }

  emitter.emit("progress", { step: "PULL", entity: "profile", status: "done", pulled });
  return { pulled, conflicts };
};