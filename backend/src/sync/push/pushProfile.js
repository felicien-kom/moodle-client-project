// src/sync/push/pushProfile.js
// Pousse les modifications du profil local vers Moodle.
// Propriétaire : CLIENT — le profil local gagne toujours en cas de conflit.
//
// Vérification de conflit : on récupère le timemodified serveur avant de pousser.
// Comme CLIENT gagne toujours sur le profil, le conflit est loggé mais le push se fait quand même.

import { moodleFetch } from "../../config/moodleApi.js";
import { SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pushProfile = async ({ prisma, token, userId, emitter }) => {
  emitter.emit("progress", { step: "PUSH", entity: "profile", status: "start" });

  const user = await prisma.localUser.findFirst({
    where: { sync_status: "PENDING_PUSH" },
  });

  if (!user) {
    emitter.emit("progress", { step: "PUSH", entity: "profile", status: "done", pushed: 0 });
    return { pushed: 0, conflicts: 0 };
  }

  let conflicts = 0;

  try {
    // Vérification de conflit si l'entité existe déjà sur le serveur (server_id connu)
    if (user.server_id && user.server_timemodified) {
      const { data: siteInfo, servertime } = await moodleFetch(
        "core_webservice_get_site_info",
        {},
        token
      );

      const serverChanged = servertime > (user.server_timemodified ?? 0);

      if (serverChanged) {
        const resolution = resolveConflict("profile"); // toujours CLIENT → PUSH
        conflicts++;
        emitter.emit("progress", {
          step:       "CONFLICT",
          entity:     "profile",
          resolution,
          note:       "Server profile changed — client wins, pushing local version",
        });
        // Si la résolution était PULL on n'irait pas plus loin, mais pour le profil c'est toujours PUSH
        if (resolution === SyncCase.PULL) {
          emitter.emit("progress", { step: "PUSH", entity: "profile", status: "done", pushed: 0 });
          return { pushed: 0, conflicts };
        }
      }
    }

    // Pousser la version locale vers Moodle
    await moodleFetch("core_user_update_users", {
      users: [{
        id:        user.moodleUserId,
        firstname: user.name.split(" ")[0] ?? user.name,
        lastname:  user.name.split(" ").slice(1).join(" ") || user.name,
      }],
    }, token);

    // Récupérer le servertime après le push pour mettre à jour les colonnes sync
    const { servertime: newServertime } = await moodleFetch(
      "core_webservice_get_site_info",
      {},
      token
    );

    await prisma.localUser.update({
      where: { id: user.id },
      data: {
        sync_status:         "SYNCED",
        server_timemodified: newServertime,
        last_synced_at:      newServertime,
      },
    });

    emitter.emit("progress", { step: "PUSH", entity: "profile", status: "done", pushed: 1 });
    return { pushed: 1, conflicts };

  } catch (err) {
    emitter.emit("progress", { step: "PUSH_ERROR", entity: "profile", error: err.message });
    return { pushed: 0, conflicts };
  }
};