// src/sync/pull/pullAssignments.js
import { moodleFetch } from "../../config/moodleApi.js";
import { diagnose, diagnoseNew, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pullAssignments = async ({ prisma, token, cursor, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "assignments", status: "start" });

  const localCourses = await prisma.course.findMany({
    where:  { server_id: { not: null } },
    select: { id: true, server_id: true },
  });

  if (localCourses.length === 0) {
    emitter.emit("progress", { step: "PULL", entity: "assignments", status: "done", pulled: 0 });
    return { pulled: 0, conflicts: 0 };
  }

  const { data: response } = await moodleFetch(
    "mod_assign_get_assignments",
    { courseids: localCourses.map((c) => c.server_id) },
    token
  );

  let pulled = 0;
  let conflicts = 0;

  for (const serverCourse of response.courses ?? []) {
    const localCourse = localCourses.find((c) => c.server_id === serverCourse.id);
    if (!localCourse) continue;

    for (const serverAssign of serverCourse.assignments ?? []) {
      const serverTimemodified = serverAssign.timemodified;
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
          emitter.emit("progress", {
            step: "CONFLICT", entity: "assignment",
            id: serverAssign.id, resolution: action,
          });
        }
      }

      if (action === SyncCase.PULL) {
        await prisma.assignment.upsert({
          where:  { server_id: serverAssign.id },
          update: {
            name:                serverAssign.name,
            intro:               serverAssign.intro ?? null,
            dueDate:             serverAssign.duedate ?? null,
            cutoffDate:          serverAssign.cutoffdate ?? null,
            server_timemodified: serverTimemodified,
            sync_status:         "SYNCED",
            last_synced_at:      serverTimemodified,
          },
          create: {
            courseId:            localCourse.id,
            name:                serverAssign.name,
            intro:               serverAssign.intro ?? null,
            dueDate:             serverAssign.duedate ?? null,
            cutoffDate:          serverAssign.cutoffdate ?? null,
            server_id:           serverAssign.id,
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

  emitter.emit("progress", { step: "PULL", entity: "assignments", status: "done", pulled, conflicts });
  return { pulled, conflicts };
};