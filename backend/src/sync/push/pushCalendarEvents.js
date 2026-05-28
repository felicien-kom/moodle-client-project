// src/sync/push/pushCalendarEvents.js
// Pousse les événements personnels (type "user") vers Moodle.
// Gère le Soft Delete (isDeleted: true) et l'astuce de "Delete & Recreate" pour les mises à jour.

import { moodleFetch } from "../../config/moodleApi.js";
import { diagnoseLocalOnly, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pushCalendarEvents = async ({ prisma, token, emitter }) => {
  emitter.emit("progress", { step: "PUSH", entity: "calendar_events", status: "start" });

  const pendingEvents = await prisma.calendarEvent.findMany({
    where: { sync_status: "PENDING_PUSH" },
    include: { course: { select: { server_id: true } } }
  });

  let pushed = 0;
  let conflicts = 0;

  for (const localEvent of pendingEvents) {
    try {
      // ─── ÉTAPE 1 : RÉSOLUTION DES CONFLITS (Si l'événement existe déjà sur Moodle) ───
      let shouldPush = true;

      if (localEvent.server_id) {
        const { data: serverData } = await moodleFetch(
          "core_calendar_get_calendar_events",
          { events: { eventids: [localEvent.server_id] } },
          token
        );

        const serverEvent = serverData.events?.[0];
        const serverTimemodified = serverEvent?.timemodified ?? 0;

        if (serverEvent && serverTimemodified > (localEvent.server_timemodified ?? 0)) {
          // Conflit : modifié sur le serveur ET en local.
          // Le résolveur devrait pointer sur "SERVER" par défaut, mais pour un événement "user", 
          // c'est l'étudiant qui est maître. On force la victoire du CLIENT ici.
          const resolution = SyncCase.PUSH; 
          conflicts++;
          
          emitter.emit("progress", {
            step: "CONFLICT", entity: "calendar_event",
            localId: localEvent.id, resolution: "CLIENT WINS (User Event)",
          });
        }
      }

      if (!shouldPush) continue;

      // ─── ÉTAPE 2 : SUPPRESSION SUR MOODLE (Si isDeleted === true OU pour Mise à jour) ───
      if (localEvent.server_id) {
        // On supprime l'ancienne version sur le serveur
        await moodleFetch("core_calendar_delete_calendar_events", {
          events: [{
            eventid: localEvent.server_id,
            repeat: 0 // On ne supprime pas les événements répétés par erreur
          }]
        }, token);
      }

      // ─── ÉTAPE 3 : FINALISATION DU SOFT DELETE ─────────────────────────────────────────
      if (localEvent.isDeleted) {
        // La suppression sur le serveur a réussi, on peut maintenant détruire la donnée locale
        await prisma.calendarEvent.delete({ where: { id: localEvent.id } });
        pushed++;
        emitter.emit("progress", { step: "PUSH", entity: "calendar_event_deleted", localId: localEvent.id });
        continue; // On passe à l'événement suivant
      }

      // ─── ÉTAPE 4 : CRÉATION DU NOUVEL ÉVÉNEMENT SUR MOODLE ─────────────────────────────
      const eventPayload = {
        name:         localEvent.name,
        description:  localEvent.description ?? "",
        timestart:    localEvent.timeStart,
        timeduration: localEvent.timeDuration,
        eventtype:    "user",
      };

      // Si lié à un cours, on passe le server_id du cours
      if (localEvent.course?.server_id) {
        eventPayload.courseid = localEvent.course.server_id;
      }

      const { data: newServerData } = await moodleFetch("core_calendar_create_calendar_events", {
        events: [eventPayload]
      }, token);

      const newMoodleEvent = newServerData.events?.[0];

      if (!newMoodleEvent) {
        throw new Error("Moodle did not return the created event.");
      }

      // ─── ÉTAPE 5 : MISE À JOUR DE LA BD LOCALE ────────────────────────────────────────
      await prisma.calendarEvent.update({
        where: { id: localEvent.id },
        data: {
          server_id:           newMoodleEvent.id,
          sync_status:         "SYNCED",
          server_timemodified: newMoodleEvent.timemodified,
          last_synced_at:      newMoodleEvent.timemodified,
        },
      });

      pushed++;
      emitter.emit("progress", { step: "PUSH", entity: "calendar_event_synced", localId: localEvent.id, serverId: newMoodleEvent.id });

    } catch (err) {
      emitter.emit("progress", {
        step: "PUSH_ERROR", entity: "calendar_event",
        localId: localEvent.id, error: err.message,
      });
    }
  }

  emitter.emit("progress", { step: "PUSH", entity: "calendar_events", status: "done", pushed });
  return { pushed, conflicts };
};