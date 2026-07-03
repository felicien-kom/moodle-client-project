// src/sync/pull/pullAssignments.js
// Pull des devoirs et soumissions existantes.

import { moodleFetch } from "../../config/moodleApi.js";
import { diagnose, diagnoseNew, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pullAssignments = async ({ prisma, token, moodleUserId, cursor, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "assignments", status: "start" });

  const enabledServerIds = await _getEnabledCourseServerIds(prisma);
  const localCourses = await prisma.course.findMany({
    where:  { server_id: { in: enabledServerIds } },
    select: { id: true, server_id: true },
  });

  if (localCourses.length === 0) {
    emitter.emit("progress", { step: "PULL", entity: "assignments", status: "done", pulled: 0 });
    return { pulled: 0, conflicts: 0 };
  }

  const { data: response } = await moodleFetch(
    "mod_assign_get_assignments",
    { courseids: localCourses.map(c => c.server_id) },
    token
  );

  let pulled = 0;
  let conflicts = 0;

  for (const serverCourse of response.courses ?? []) {
    const localCourse = localCourses.find(c => c.server_id === serverCourse.id);
    if (!localCourse) continue;

    for (const serverAssign of serverCourse.assignments ?? []) {
      const serverTimemodified = serverAssign.timemodified ?? 0;
      const local = await prisma.assignment.findFirst({ where: { server_id: serverAssign.id } });
      let action;

      if (!local) {
        action = diagnoseNew();
      } else {
        if (local.sync_status === "SYNCED" && local.last_synced_at >= cursor) continue;
        action = diagnose(local, serverTimemodified, cursor);
        if (action === SyncCase.CONFLICT) {
          action = resolveConflict("assignment");
          conflicts++;
          emitter.emit("progress", { step: "CONFLICT", entity: "assignment", id: serverAssign.id, resolution: action });
        }
      }

      if (action === SyncCase.PULL) {
        // Détecter le type de soumission autorisé
        const pluginTypes = serverAssign.configs
          ?.filter(c => c.plugin === "onlinetext" && c.subtype === "assignsubmission" && c.name === "enabled" && c.value === "1")
          .length > 0 ? "text" : null;
        const filePlugin = serverAssign.configs
          ?.filter(c => c.plugin === "file" && c.subtype === "assignsubmission" && c.name === "enabled" && c.value === "1")
          .length > 0;
        const allowedTypes = pluginTypes && filePlugin ? "both" : pluginTypes ? "text" : filePlugin ? "file" : null;

        await prisma.assignment.upsert({
          where:  { server_id: serverAssign.id },
          update: {
            name:                serverAssign.name,
            intro:               _stripHtml(serverAssign.intro) ?? null,
            dueDate:             serverAssign.duedate    ?? null,
            cutoffDate:          serverAssign.cutoffdate ?? null,
            maxGrade:            serverAssign.grade      ?? null,
            allowedTypes:        allowedTypes,
            server_timemodified: serverTimemodified,
            sync_status:         "SYNCED",
            last_synced_at:      serverTimemodified,
          },
          create: {
            courseId:            localCourse.id,
            server_id:           serverAssign.id,
            name:                serverAssign.name,
            intro:               _stripHtml(serverAssign.intro) ?? null,
            dueDate:             serverAssign.duedate    ?? null,
            cutoffDate:          serverAssign.cutoffdate ?? null,
            maxGrade:            serverAssign.grade      ?? null,
            allowedTypes:        allowedTypes,
            server_timemodified: serverTimemodified,
            sync_status:         "SYNCED",
            last_synced_at:      serverTimemodified,
          },
        });
        pulled++;
        emitter.emit("progress", { step: "PULL", entity: "assignment", id: serverAssign.id, name: serverAssign.name });
      }
    }
  }

  // Pull des soumissions existantes de l'utilisateur
  const localAssignments = await prisma.assignment.findMany({
    where:  { server_id: { not: null } },
    select: { id: true, server_id: true },
  });

  const assignmentServerIds = localAssignments.map(a => a.server_id);
  
  // RÃ©cupÃ©rer aussi les notes pour toutes ces soumissions !
  let serverGrades = [];
  if (assignmentServerIds.length > 0) {
    try {
      const { data: gradesResp } = await moodleFetch(
        "mod_assign_get_grades",
        { assignmentids: assignmentServerIds },
        token
      );
      serverGrades = gradesResp.assignments ?? [];
    } catch { /* Ignore les erreurs si pas de droit  */ }
  }

  for (const localAssign of localAssignments) {
    try {
      const { data: submResp } = await moodleFetch(
        "mod_assign_get_submissions",
        { assignmentids: [localAssign.server_id], status: "" },
        token
      );
      const moodleSubmissions = submResp.assignments?.[0]?.submissions ?? [];
      const userSubmission = moodleSubmissions.find(s => s.userid === moodleUserId);

      if (userSubmission) {
        // RÃ©cupÃ©rer la note de ce devoir spÃ©cifique pour cet utilisateur
        const assignGradeData = serverGrades.find(g => g.assignmentid === localAssign.server_id);
        const userGrade = assignGradeData?.grades?.find(g => g.userid === moodleUserId);
        const grade = userGrade && userGrade.grade !== "-1.00000" ? parseFloat(userGrade.grade) : null;
        const gradedAt = userGrade ? userGrade.timemodified : null;

        // La date de modification Moodle globale est le max entre la soumission et la note
        const serverTimemodified = Math.max(userSubmission.timemodified ?? 0, gradedAt ?? 0);
        
        const local = await prisma.assignmentSubmission.findFirst({ where: { server_id: userSubmission.id } });
        let action = local ? diagnose(local, serverTimemodified, cursor) : diagnoseNew();

        if (action === SyncCase.CONFLICT) {
          action = resolveConflict("assignment_submission");
          conflicts++;
        }

        if (action === SyncCase.PULL) {
          const textPlugin = userSubmission.plugins?.find(p => p.type === "onlinetext");
          // Conserver le prÃ©cÃ©dent s'il existe (pour le hors-ligne d'un type non-texte par exemple)
          const submissionText = textPlugin?.editorfields?.[0]?.value ?? local?.submissionText ?? null;
          
          const state = userSubmission.status === "submitted" ? "SUBMITTED"
            : userSubmission.status === "graded" || userGrade ? "GRADED" : "DRAFT";

          await prisma.assignmentSubmission.upsert({
            where:  { server_id: userSubmission.id },
            update: {
              submissionText,
              state,
              grade,
              gradedAt,
              server_timemodified: serverTimemodified,
              sync_status:         "SYNCED",
              last_synced_at:      serverTimemodified,
            },
            create: {
              assignmentId:        localAssign.id,
              server_id:           userSubmission.id,
              submissionText,
              state,
              grade,
              gradedAt,
              server_timemodified: serverTimemodified,
              sync_status:         "SYNCED",
              last_synced_at:      serverTimemodified,
            },
          });
          pulled++;
        }
      }
    } catch { /* Un devoir sans soumission ne bloque pas */ }
  }

  emitter.emit("progress", { step: "PULL", entity: "assignments", status: "done", pulled, conflicts });
  return { pulled, conflicts };
};

const _getEnabledCourseServerIds = async (prisma) => {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { syncEnabled: true }, select: { courseServerId: true },
  });
  return enrollments.map(e => e.courseServerId);
};

const _stripHtml = (str) => {
  if (!str) return null;
  return str.replace(/&lt;[^&gt;]*&gt;/g, " ").replace(/\s+/g, " ").trim() || null;
};