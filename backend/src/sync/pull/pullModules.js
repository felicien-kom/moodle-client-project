// src/sync/pull/pullModules.js
// Synchronise la structure complète d'un cours depuis core_course_get_contents.
//
// Réponse Moodle (structure réelle) :
//   sections[]
//     id         : server_id de la section (ex: 6, 7, 8)
//     name       : "Généralités", "Chapitre 1", ...
//     section    : index d'ordre (0, 1, 2...)
//     modules[]
//       id       : server_id du module (ex: 2, 3, 4)
//       modname  : "forum" | "url" | "resource" | "assign" | "quiz" | "page" | ...
//       instance : server_id de l'activité associée (le quiz, le devoir...)
//       contents[]: fichiers ou URLs du module
//         fileurl  : URL Moodle (pluginfile.php ou lien externe)
//         filename : nom du fichier
//         mimetype : "application/pdf" | ...
//         filesize : octets
//
// Hiérarchie stockée : Course → Section → Module → Resource

import { moodleFetch } from "../../config/moodleApi.js";

export const pullModules = async ({ prisma, token, cursor, servertime, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "modules", status: "start" });

  // Uniquement les cours inscrits avec syncEnabled
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { syncEnabled: true },
  });

  if (enrollments.length === 0) {
    emitter.emit("progress", { step: "PULL", entity: "modules", status: "done", pulled: 0 });
    return { pulled: 0, conflicts: 0 };
  }

  let pulled = 0;

  for (const enrollment of enrollments) {
    const localCourse = await prisma.course.findFirst({
      where: { server_id: enrollment.courseServerId },
    });
    if (!localCourse) { console.log("Pas de local course"); continue; }

    // Optimisation : si le cours n'a pas changé depuis le dernier curseur, skip
    if (
      localCourse.last_synced_at &&
      localCourse.last_synced_at <= cursor &&
      localCourse.sync_status === "SYNCED"
    ) {
      console.log("Cours inchangé");
      // continue;// Le cours peut ne pas avoir change mais je me dis que les modules oui, donc on laisse d'abord
    }

    try {
      const { data: sections } = await moodleFetch(
        "core_course_get_contents",
        { courseid: enrollment.courseServerId },
        token
      );
      console.log("Contenus des cours fetch");

      if (!Array.isArray(sections)) continue;

      for (const section of sections) {
        // ── 1. Upsert Section ──────────────────────────────
        const localSection = await prisma.section.upsert({
          where:  { server_id: section.id },
          update: {
            name:           section.name    || `Section ${section.section}`,
            sectionIndex:   section.section ?? 0,
            summary:        _stripHtml(section.summary) ?? null,
            visible:        Boolean(section.visible ?? 1),
            sync_status:    "SYNCED",
            last_synced_at: servertime,
          },
          create: {
            courseId:       localCourse.id,
            server_id:      section.id,
            name:           section.name    || `Section ${section.section}`,
            sectionIndex:   section.section ?? 0,
            summary:        _stripHtml(section.summary) ?? null,
            visible:        Boolean(section.visible ?? 1),
            sync_status:    "SYNCED",
            last_synced_at: servertime,
          },
        });

        // ── 2. Upsert chaque Module de cette section ───────
        let sortOrder = 0;
        for (const mod of section.modules ?? []) {
          const localModule = await prisma.module.upsert({
            where:  { server_id: mod.id },
            update: {
              sectionId:      localSection.id,
              name:           mod.name,
              modType:        mod.modname,
              instance:       mod.instance    ?? null,
              visible:        Boolean(mod.visible ?? 1),
              sortOrder,
              description:    mod.description ? _stripHtml(mod.description) : null,
              sync_status:    "SYNCED",
              last_synced_at: servertime,
            },
            create: {
              courseId:       localCourse.id,
              sectionId:      localSection.id,
              server_id:      mod.id,
              name:           mod.name,
              modType:        mod.modname,
              instance:       mod.instance    ?? null,
              visible:        Boolean(mod.visible ?? 1),
              sortOrder,
              description:    mod.description ? _stripHtml(mod.description) : null,
              sync_status:    "SYNCED",
              last_synced_at: servertime,
            },
          });

          sortOrder++;
          pulled++;

          // ── 3. Upsert Resources du module ─────────────────
          // contents[] contient les fichiers et URLs du module
          const contents = mod.contents ?? [];
          for (let i = 0; i < contents.length; i++) {
            const content = contents[i];
            if (!content.fileurl) continue;

            // Construire un server_id stable : basé sur mod.id + index du contenu
            // mod.id est stable, l'index positionnel aussi pour un même module
            const resourceServerId = mod.id * 1000 + i;

            await prisma.resource.upsert({
              where:  { server_id: resourceServerId },
              update: {
                name:           content.filename || mod.name,
                type:           _contentType(mod.modname, content.type),
                moodleUrl:      content.fileurl,
                mimeType:       content.mimetype  ?? null,
                fileSize:       content.filesize  ?? null,
                sync_status:    "SYNCED",
                last_synced_at: servertime,
              },
              create: {
                courseId:       localCourse.id,
                moduleId:       localModule.id,
                server_id:      resourceServerId,
                name:           content.filename || mod.name,
                type:           _contentType(mod.modname, content.type),
                moodleUrl:      content.fileurl,
                mimeType:       content.mimetype  ?? null,
                fileSize:       content.filesize  ?? null,
                sync_status:    "SYNCED",
                last_synced_at: servertime,
              },
            });
          }
        }
      }

      emitter.emit("progress", {
        step:     "PULL",
        entity:   "modules",
        courseId: localCourse.id,
        title:    localCourse.title,
      });

    } catch (err) {
      emitter.emit("progress", {
        step:           "PULL_ERROR",
        entity:         "modules",
        courseServerId: enrollment.courseServerId,
        error:          err.message,
      });
    }
  }

  emitter.emit("progress", { step: "PULL", entity: "modules", status: "done", pulled });
  return { pulled, conflicts: 0 };
};

// ─── Helpers ─────────────────────────────────────────────────

const _contentType = (modname, contentType) => {
  if (modname === "url")    return "url";
  if (modname === "page")   return "page";
  if (modname === "folder") return "folder";
  if (contentType === "url") return "url";
  return "file";
};

const _stripHtml = (str) => {
  if (!str) return null;
  const stripped = str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return stripped || null;
};