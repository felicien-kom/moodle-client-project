// src/sync/pull/pullCalendarEvents.js
import { moodleFetch } from "../../config/moodleApi.js";
import { diagnose, diagnoseNew, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pullCalendarEvents = async ({ prisma, token, cursor, servertime, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "calendar_events", status: "start" });

  // 1. Récupérer les ID serveur des cours activés pour la synchro
  const enrollments = await prisma.courseEnrollment.findMany({ where: { syncEnabled: true } });
  const courseServerIds = enrollments.map(e => e.courseServerId);

  // S'il n'y a aucun cours, on force au moins un tableau vide pour ne pas faire planter Moodle,
  // mais on demande toujours les événements utilisateur et site.
  const params = {
    events: {
      courseids: courseServerIds.length > 0 ? courseServerIds : [],
    },
    options: {
      userevents: 1, // Récupérer les événements personnels de l'utilisateur
      siteevents: 1, // Récupérer les événements globaux du site
    }
  };

  let pulled = 0;
  let conflicts = 0;

  try {
    const { data: result } = await moodleFetch("core_calendar_get_calendar_events", params, token);
    const events = result.events || [];

    for (const event of events) {
      const serverTimemodified = event.timemodified ?? 0;

      // 2. Gestion de la liaison au Cours
      let localCourseId = null;
      if (event.courseid && event.courseid > 0) {
        // Attention : event.courseid est l'ID Moodle. Il faut trouver notre ID local.
        const localCourse = await prisma.course.findUnique({ 
          where: { server_id: event.courseid } 
        });
        if (localCourse) {
          localCourseId = localCourse.id;
        }
      }

      // 3. Diagnostic Offline-First
      const local = await prisma.calendarEvent.findFirst({ where: { server_id: event.id } });
      let action = local ? diagnose(local, serverTimemodified, cursor) : diagnoseNew();

      if (action === SyncCase.CONFLICT) {
        // En général, le calendrier est géré par le serveur (profs/admin). 
        // Si vous permettez la création d'événements 100% locaux plus tard, ajustez resolveConflict("event").
        action = resolveConflict("event"); // Typiquement -> PULL
        conflicts++;
      }

      // 4. Écriture en base locale
      if (action === SyncCase.PULL) {
        await prisma.calendarEvent.upsert({
          where:  { server_id: event.id },
          update: {
            name:                event.name,
            description:         _stripHtml(event.description),
            eventType:           event.eventtype,
            timeStart:           event.timestart,
            timeDuration:        event.timeduration ?? 0,
            courseId:            localCourseId,
            server_timemodified: serverTimemodified,
            sync_status:         "SYNCED",
            last_synced_at:      servertime,
          },
          create: {
            server_id:           event.id,
            name:                event.name,
            description:         _stripHtml(event.description),
            eventType:           event.eventtype,
            timeStart:           event.timestart,
            timeDuration:        event.timeduration ?? 0,
            courseId:            localCourseId,
            server_timemodified: serverTimemodified,
            sync_status:         "SYNCED",
            last_synced_at:      servertime,
          },
        });
        pulled++;
      }
    }
  } catch (err) {
    emitter.emit("progress", { step: "PULL_ERROR", entity: "calendar_events", error: err.message });
  }

  emitter.emit("progress", { step: "PULL", entity: "calendar_events", status: "done", pulled, conflicts });
  return { pulled, conflicts };
};

const _stripHtml = (str) => str ? str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null : null;