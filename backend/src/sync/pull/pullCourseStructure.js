// src/sync/pull/pullCourseStructure.js
import { moodleFetch } from "../../config/moodleApi.js";

export const pullCourseStructure = async ({ prisma, token, cursor, servertime, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "structure", status: "start" });

  const enrollments = await prisma.courseEnrollment.findMany({ where: { syncEnabled: true } });
  if (enrollments.length === 0) return { pulled: 0, conflicts: 0 };

  let pulled = 0;

  for (const enrollment of enrollments) {
    const localCourse = await prisma.course.findFirst({ where: { server_id: enrollment.courseServerId } });
    if (!localCourse) continue;

    try {
      const { data: sections } = await moodleFetch(
        "core_course_get_contents",
        { courseid: enrollment.courseServerId },
        token
      );

      if (!Array.isArray(sections)) continue;

      for (const section of sections) {
        const sectionName = section.name || `Section ${section.section}`;
        const sectionIndex = section.section ?? 0;
        const sectionSummary = _stripHtml(section.summary);
        const sectionVisible = Boolean(section.visible ?? 1);

        // 1. Stratégie d'évitement d'écriture pour la Section
        const existingSection = await prisma.section.findUnique({
          where: { server_id: section.id }
        });

        let localSection = existingSection;

        const sectionChanged = !existingSection || 
          existingSection.name !== sectionName ||
          existingSection.sectionIndex !== sectionIndex ||
          existingSection.summary !== sectionSummary ||
          existingSection.visible !== sectionVisible ||
          existingSection.courseId !== localCourse.id;

        if (sectionChanged) {
          localSection = await prisma.section.upsert({
            where:  { server_id: section.id },
            update: {
              name:           sectionName,
              sectionIndex:   sectionIndex,
              summary:        sectionSummary,
              visible:        sectionVisible,
              sync_status:    "SYNCED",
              last_synced_at: servertime,
            },
            create: {
              courseId:       localCourse.id,
              server_id:      section.id,
              name:           sectionName,
              sectionIndex:   sectionIndex,
              summary:        sectionSummary,
              visible:        sectionVisible,
              sync_status:    "SYNCED",
              last_synced_at: servertime,
            },
          });
          pulled++;
        }

        // 2. Stratégie d'évitement d'écriture pour l'enveloppe Module
        let sortOrder = 0;
        for (const mod of section.modules ?? []) {
          const modVisible = Boolean(mod.visible ?? 1);
          const modInstance = mod.instance ?? null;

          const existingModule = await prisma.module.findUnique({
            where: { server_id: mod.id }
          });

          const moduleChanged = !existingModule ||
            existingModule.sectionId !== localSection.id ||
            existingModule.name !== mod.name ||
            existingModule.modType !== mod.modname ||
            existingModule.instance !== modInstance ||
            existingModule.visible !== modVisible ||
            existingModule.sortOrder !== sortOrder ||
            existingModule.courseId !== localCourse.id;

          if (moduleChanged) {
            await prisma.module.upsert({
              where:  { server_id: mod.id },
              update: {
                sectionId:      localSection.id,
                name:           mod.name,
                modType:        mod.modname,
                instance:       modInstance,
                visible:        modVisible,
                sortOrder,
                sync_status:    "SYNCED",
                last_synced_at: servertime,
              },
              create: {
                courseId:       localCourse.id,
                sectionId:      localSection.id,
                server_id:      mod.id,
                name:           mod.name,
                modType:        mod.modname,
                instance:       modInstance,
                visible:        modVisible,
                sortOrder,
                sync_status:    "SYNCED",
                last_synced_at: servertime,
              },
            });
            pulled++;
          }
          sortOrder++;
        }
      }
    } catch (err) {
      emitter.emit("progress", { step: "PULL_ERROR", entity: "structure", error: err.message });
    }
  }

  emitter.emit("progress", { step: "PULL", entity: "structure", status: "done", pulled });
  return { pulled, conflicts: 0 };
};

const _stripHtml = (str) => str ? str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null : null;