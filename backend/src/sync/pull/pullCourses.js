// src/sync/pull/pullCourses.js
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

  const serverCourses = await _fetchAllCourses(token, moodleUserId);

  let pulled = 0;
  let conflicts = 0;

  for (const serverCourse of serverCourses) {
    const serverTimemodified = serverCourse.timemodified;
    const local = await prisma.course.findFirst({ where: { server_id: serverCourse.id } });

    let action;

    if (!local) {
      action = diagnoseNew();
    } else {
      if (local.sync_status === "SYNCED" && local.last_synced_at >= cursor) continue;
      action = diagnose(local, serverTimemodified, cursor);

      if (action === SyncCase.CONFLICT) {
        action = resolveConflict("course"); // SERVER gagne
        conflicts++;
        emitter.emit("progress", {
          step: "CONFLICT", entity: "course",
          id: serverCourse.id, resolution: action,
        });
      }
    }

    if (action === SyncCase.PULL) {
      await prisma.course.upsert({
        where:  { server_id: serverCourse.id },
        update: {
          title:               serverCourse.fullname,
          shortName:           serverCourse.shortname,
          summary:             serverCourse.summary ?? null,
          startDate:           serverCourse.startdate ?? null,
          endDate:             serverCourse.enddate ?? null,
          visible:             Boolean(serverCourse.visible),
          server_timemodified: serverTimemodified,
          sync_status:         "SYNCED",
          last_synced_at:      serverTimemodified,
        },
        create: {
          title:               serverCourse.fullname,
          shortName:           serverCourse.shortname,
          summary:             serverCourse.summary ?? null,
          startDate:           serverCourse.startdate ?? null,
          endDate:             serverCourse.enddate ?? null,
          visible:             Boolean(serverCourse.visible),
          server_id:           serverCourse.id,
          server_timemodified: serverTimemodified,
          sync_status:         "SYNCED",
          last_synced_at:      serverTimemodified,
        },
      });
      pulled++;
      emitter.emit("progress", {
        step: "PULL", entity: "course",
        id: serverCourse.id, title: serverCourse.fullname,
      });
    }
  }

  emitter.emit("progress", { step: "PULL", entity: "courses", status: "done", pulled, conflicts });
  return { pulled, conflicts };
};

const _fetchAllCourses = async (token, moodleUserId) => {
  const all = [];
  let offset = 0;

  while (true) {
    const { data: page } = await moodleFetch(
      "core_enrol_get_users_courses",
      { userid: moodleUserId, returnusercount: 0, limit: PAGE_SIZE, offset },
      token
    );

    if (!Array.isArray(page) || page.length === 0) break;
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
};