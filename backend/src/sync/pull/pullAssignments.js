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

    const assignments = courseData.assignments || [];

    for (const assign of assignments) {
      const serverTimemodified = assign.timemodified ?? 0;
      const parentModule = await prisma.module.findUnique({ where: { server_id: assign.cmid } });

      const local = await prisma.assignment.findFirst({ where: { server_id: assign.id } });
      let action = local ? diagnose(local, serverTimemodified, cursor) : diagnoseNew();

      if (action === SyncCase.CONFLICT) action = resolveConflict("assignment"); // SERVER gagne

      if (action === SyncCase.PULL) {
        const savedAssign = await prisma.assignment.upsert({
          where:  { server_id: assign.id },
          update: {
            courseId:            localCourse.id,
            moduleId:            parentModule ? parentModule.id : null,
            name:                assign.name,
            intro:               assign.intro ? _stripHtml(assign.intro) : null,
            dueDate:             assign.duedate ?? null,
            cutoffDate:          assign.cutoffdate ?? null,
            maxGrade:            assign.grade ?? null,
            server_timemodified: serverTimemodified,
            sync_status:         "SYNCED",
            last_synced_at:      servertime,
          },
          create: {
            courseId:            localCourse.id,
            moduleId:            parentModule ? parentModule.id : null,
            server_id:           assign.id,
            name:                assign.name,
            intro:               assign.intro ? _stripHtml(assign.intro) : null,
            dueDate:             assign.duedate ?? null,
            cutoffDate:          assign.cutoffdate ?? null,
            maxGrade:            assign.grade ?? null,
            server_timemodified: serverTimemodified,
            sync_status:         "SYNCED",
            last_synced_at:      servertime,
          },
        });
        pulled++;

        // Gestion des fichiers joints aux consignes du devoir (Sujets PDF)
        const introFiles = assign.introattachments || [];
        for (const f of introFiles) {
          if (!f.fileurl) continue;

          await prisma.localFile.upsert({
            where: { moodleUrl: f.fileurl }, // Identifiant unique
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