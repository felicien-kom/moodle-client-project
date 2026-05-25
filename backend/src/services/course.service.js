// src/services/course.service.js

import { moodleFetch } from "../config/moodleApi.js";

// ─── ONLINE (Inchangé, code parfait) ─────────────────────────
export const getCatalogue = async (token, { search = "", categoryId, page = 0, perPage = 20 } = {}) => {
  const { data } = await moodleFetch("core_course_get_courses", {}, token);
  const realCourses = data.filter(course => course.format !== "site");
  return {
    total:   realCourses.length ?? 0,
    courses: (realCourses ?? []).map(_formatCatalogCourse),
  };
};

export const enrollCourse = async (prisma, token, courseServerId) => {
  const existing = await prisma.courseEnrollment.findUnique({ where: { courseServerId } });
  if (existing?.enrolledOnServer) {
    const err = new Error("Already enrolled in this course");
    err.statusCode = 409;
    throw err;
  }
  const { data } = await moodleFetch("enrol_self_enrol_user", { courseid: courseServerId }, token);
  if (data?.status !== true) {
    const err = new Error(data?.warnings?.[0]?.message ?? "Enrollment failed on server");
    err.statusCode = 400;
    throw err;
  }
  const enrollment = await prisma.courseEnrollment.upsert({
    where:  { courseServerId },
    update: { enrolledOnServer: true, syncEnabled: true },
    create: { courseServerId, enrolledOnServer: true, syncEnabled: true },
  });
  return { enrollment, message: "Enrolled successfully. Run sync to download course content." };
};

export const unenrollCourse = async (prisma, token, courseServerId) => {
  const enrollment = await prisma.courseEnrollment.findUnique({ where: { courseServerId } });
  if (!enrollment) {
    const err = new Error("Not enrolled in this course");
    err.statusCode = 404;
    throw err;
  }
  await prisma.courseEnrollment.update({
    where: { courseServerId },
    data:  { syncEnabled: false },
  });
  return { message: "Course sync disabled. Local data retained." };
};

// ─── OFFLINE (Adapté au nouveau schéma Prisma) ───────────────

export const getLocalCourses = async (prisma) => {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { syncEnabled: true },
    select: { courseServerId: true },
  });
  const serverIds = enrollments.map(e => e.courseServerId);

  return prisma.course.findMany({
    where:   { server_id: { in: serverIds } },
    orderBy: { title: "asc" },
  });
};

export const getLocalCourseById = async (prisma, localId) => {
  const course = await prisma.course.findUnique({
    where:   { id: localId },
    include: {
      grades:      true,
      events:      { orderBy: { timeStart: "asc" } }, // Ajout des événements
    },
  });
  if (!course) {
    const err = new Error("Course not found locally. Run sync first.");
    err.statusCode = 404;
    throw err;
  }
  return course;
};

export const getLocalAssignmentsByCourse = async (prisma, localCourseId) => {
  return prisma.assignment.findMany({
    where:   { courseId: localCourseId },
    include: { 
      submissions: true,
      introFiles: true // Les consignes PDF du prof
    },
    orderBy: { dueDate: "asc" },
  });
};

// NOUVEAU : Récupération centralisée des fichiers physiques du cours
export const getLocalFilesByCourse = async (prisma, localCourseId) => {
  return prisma.localFile.findMany({
    where: {
      OR: [
        { fileResource: { module: { courseId: localCourseId } } },
        { folderResource: { module: { courseId: localCourseId } } },
        { assignment: { courseId: localCourseId } }
      ]
    },
    orderBy: { filename: "asc" },
  });
};

export const getLocalGradesByCourse = async (prisma, localCourseId) => {
  return prisma.grade.findMany({
    where: { courseId: localCourseId },
  });
};

export const getLocalEventsByCourse = async (prisma, localCourseId) => {
  return prisma.calendarEvent.findMany({
    where: { courseId: localCourseId },
    orderBy: { timeStart: "asc" }
  });
};

// LE SUPER-ENDPOINT (L'arborescence complète pour le Frontend)
export const getLocalSectionsByCourse = async (prisma, localCourseId) => {
  return prisma.section.findMany({
    where:   { courseId: localCourseId },
    orderBy: { sectionIndex: "asc" },
    include: {
      modules: {
        orderBy:  { sortOrder: "asc" },
        include:  { 
          // Remplacement de l'ancien "resources: true"
          fileResources:   { include: { files: true } },
          folderResources: { include: { files: true } },
          externalUrls:    true,
          assignments:     true,
        },
      },
    },
  });
};

// ─── Helpers ─────────────────────────────────────────────────
const _formatCatalogCourse = (c) => ({
  serverId:    c.id,
  title:       c.fullname,
  shortName:   c.shortname,
  summary:     c.summary?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null,
  categoryId:  c.categoryid,
  imageUrl:    c.courseimage ?? null,
  startDate:   c.startdate  ?? null,
  endDate:     c.enddate    ?? null,
  visible:     Boolean(c.visible ?? 1),
});