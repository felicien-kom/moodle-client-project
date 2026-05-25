// src/sync/pull/pullCourses.js
// Synchronise UNIQUEMENT les cours où l'utilisateur est inscrit (CourseEnrollment).
//
// Deux origines des inscriptions :
//   1. Inscription depuis ce client → CourseEnrollment existe déjà
//   2. Inscription existante sur le serveur → détectée via core_enrol_get_users_courses
//      → on crée CourseEnrollment automatiquement pour importer l'historique
//
// On ne pulle JAMAIS tous les cours du catalogue — uniquement les cours inscrits.

import { moodleFetch } from "../../config/moodleApi.js";
import { diagnose, diagnoseNew, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

const PAGE_SIZE = 50;

export const pullCourses = async ({ prisma, token, moodleUserId, cursor, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "courses", status: "start" });

  if (!moodleUserId) {
    emitter.emit("progress", { step: "PULL", entity: "courses", status: "done", pulled: 0 });
    return { pulled: 0, conflicts: 0 };
  }

  // Récupérer tous les cours auxquels l'utilisateur est inscrit sur le serveur
  const serverCourses = await _fetchAllEnrolledCourses(token, moodleUserId);

  let pulled = 0;
  let conflicts = 0;

  for (const serverCourse of serverCourses) {
    const serverTimemodified = serverCourse.timemodified ?? 0;

    // S'assurer qu'un CourseEnrollment existe pour ce cours
    // (cas : inscrit sur le serveur mais pas encore connu du client)
    await prisma.courseEnrollment.upsert({
      where:  { courseServerId: serverCourse.id },
      update: { enrolledOnServer: true },
      create: {
        courseServerId:   serverCourse.id,
        enrolledOnServer: true,
        syncEnabled:      true,
      },
    });

    const local = await prisma.course.findFirst({ where: { server_id: serverCourse.id } });

    let action;
    if (!local) {
      action = diagnoseNew();
    } else {
      if (local.sync_status === "SYNCED" && local.last_synced_at >= cursor) continue;
      action = diagnose(local, serverTimemodified, cursor);
      if (action === SyncCase.CONFLICT) {
        action = resolveConflict("course");
        conflicts++;
        emitter.emit("progress", { step: "CONFLICT", entity: "course", id: serverCourse.id, resolution: action });
      }
    }

    if (action === SyncCase.PULL) {
      await prisma.course.upsert({
        where:  { server_id: serverCourse.id },
        update: {
          title:               serverCourse.fullname,
          shortName:           serverCourse.shortname  ?? null,
          summary:             _stripHtml(serverCourse.summary) ?? null,
          categoryId:          serverCourse.category   ?? null,
          startDate:           serverCourse.startdate  ?? null,
          endDate:             serverCourse.enddate    ?? null,
          visible:             Boolean(serverCourse.visible ?? 1),
          imageUrl:            serverCourse.courseimage ?? null,
          format:              serverCourse.format     ?? null,
          server_timemodified: serverTimemodified,
          sync_status:         "SYNCED",
          last_synced_at:      serverTimemodified,
        },
        create: {
          title:               serverCourse.fullname,
          shortName:           serverCourse.shortname  ?? null,
          summary:             _stripHtml(serverCourse.summary) ?? null,
          categoryId:          serverCourse.category   ?? null,
          startDate:           serverCourse.startdate  ?? null,
          endDate:             serverCourse.enddate    ?? null,
          visible:             Boolean(serverCourse.visible ?? 1),
          imageUrl:            serverCourse.courseimage ?? null,
          format:              serverCourse.format     ?? null,
          server_id:           serverCourse.id,
          server_timemodified: serverTimemodified,
          sync_status:         "SYNCED",
          last_synced_at:      serverTimemodified,
        },
      });
      pulled++;
      emitter.emit("progress", { step: "PULL", entity: "course", id: serverCourse.id, title: serverCourse.fullname });
    }
  }

  emitter.emit("progress", { step: "PULL", entity: "courses", status: "done", pulled, conflicts });
  return { pulled, conflicts };
};

// Récupère tous les cours inscrits avec pagination
const _fetchAllEnrolledCourses = async (token, moodleUserId) => {
  const all = [];
  const { data: page } = await moodleFetch(
    "core_enrol_get_users_courses",
    // { userid: moodleUserId, returnusercount: 0, limit: PAGE_SIZE, offset },
    { userid: moodleUserId },
    token
  );
  all.push(...page);
  return all;
};

// Retire les balises HTML basiques des résumés Moodle
const _stripHtml = (str) => {
  if (!str) return null;
  return str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null;
};