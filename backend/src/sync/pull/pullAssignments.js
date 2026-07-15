// src/sync/pull/pullAssignments.js
import { moodleFetch } from "../../config/moodleApi.js";
import { diagnose, diagnoseNew, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pullAssignments = async ({ prisma, token, cursor, servertime, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "assignments", status: "start" });

  const enrollments = await prisma.courseEnrollment.findMany({ where: { syncEnabled: true } });
  const courseIds = enrollments.map(e => e.courseServerId);
  if (courseIds.length === 0) return { pulled: 0, conflicts: 0 };

  let pulled = 0;
  let conflicts = 0;

  const { data: result } = await moodleFetch("mod_assign_get_assignments", { courseids: courseIds }, token);
  const courses = result.courses || [];

  for (const courseData of courses) {
    const localCourse = await prisma.course.findUnique({ where: { server_id: courseData.id } });
    if (!localCourse) continue;

    for (const assign of courseData.assignments || []) {
      const serverTimemodified = assign.timemodified ?? 0;
      const parentModule = await prisma.module.findUnique({ where: { server_id: assign.cmid } });

      // 1. Extraction propre des configurations complexes (Online Text & File submission)
      let requiresText = false;
      let wordLimit = null;
      let requiresFile = false;
      let maxFiles = null;
      let maxFileSize = null;

      for (const config of assign.configs || []) {
        if (config.plugin === "onlinetext") {
          if (config.name === "enabled" && config.value === "1") requiresText = true;
          if (config.name === "wordlimit" && parseInt(config.value) > 0) wordLimit = parseInt(config.value);
        }
        if (config.plugin === "file") {
          if (config.name === "enabled" && config.value === "1") requiresFile = true;
          if (config.name === "maxfilesubmissions") maxFiles = parseInt(config.value);
          if (config.name === "maxsubmissionsizebytes") maxFileSize = parseInt(config.value);
        }
      }

      const local = await prisma.assignment.findFirst({ where: { server_id: assign.id } });
      let action = local ? diagnose(local, serverTimemodified, cursor) : diagnoseNew();

      if (action === SyncCase.CONFLICT) {
        action = resolveConflict("assignment");
      }

      if (action === SyncCase.PULL) {
        // 2. Synchronisation des métadonnées complètes du devoir
        const savedAssign = await prisma.assignment.upsert({
          where:  { server_id: assign.id },
          update: {
            courseId:                 localCourse.id,
            moduleId:                 parentModule ? parentModule.id : null,
            name:                     assign.name,
            intro:                    assign.intro ? _stripHtml(assign.intro) : null,
            activity:                 assign.activity ? _stripHtml(assign.activity) : null,
            allowSubmissionsFromDate: assign.allowsubmissionsfromdate || null,
            dueDate:                  assign.duedate || null,
            cutoffDate:               assign.cutoffdate || null,
            maxAttempts:              assign.maxattempts || null,
            maxGrade:                 assign.grade || null,
            requiresText, 
            wordLimit, 
            requiresFile, 
            maxFiles, 
            maxFileSize,
            server_timemodified:      serverTimemodified,
            sync_status:              "SYNCED",
            last_synced_at:           servertime,
          },
          create: {
            courseId:                 localCourse.id,
            moduleId:                 parentModule ? parentModule.id : null,
            server_id:                assign.id,
            name:                     assign.name,
            intro:                    assign.intro ? _stripHtml(assign.intro) : null,
            activity:                 assign.activity ? _stripHtml(assign.activity) : null,
            allowSubmissionsFromDate: assign.allowsubmissionsfromdate || null,
            dueDate:                  assign.duedate || null,
            cutoffDate:               assign.cutoffdate || null,
            maxAttempts:              assign.maxattempts || null,
            maxGrade:                 assign.grade || null,
            requiresText, 
            wordLimit, 
            requiresFile, 
            maxFiles, 
            maxFileSize,
            server_timemodified:      serverTimemodified,
            sync_status:              "SYNCED",
            last_synced_at:           servertime,
          },
        });
        pulled++;

        // 3. RECORRIGÉ : Gestion et persistance des pièces jointes aux consignes (Sujets PDF)
        const introFiles = assign.introattachments || [];
        for (const f of introFiles) {
          if (!f.fileurl) continue;

          await prisma.localFile.upsert({
            where: { moodleUrl: f.fileurl },
            update: {
              assignmentId:        savedAssign.id,
              filename:            f.filename,
              mimeType:            f.mimetype ?? null,
              fileSize:            f.filesize ?? null,
              server_timemodified: serverTimemodified,
              last_synced_at:      servertime,
            },
            create: {
              assignmentId:        savedAssign.id,
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
  }

  emitter.emit("progress", { step: "PULL", entity: "assignments", status: "done", pulled });
  return { pulled, conflicts };
};

const _stripHtml = (str) => str ? str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null : null;