// src/services/course.service.js
//
// Deux modes :
//   ONLINE  : catalogue Moodle (proxy direct, aucun stockage)
//             enrollment / unenrollment (Moodle + base locale)
//   OFFLINE : lecture des cours, modules, quiz, devoirs, ressources, notes en base locale

import { moodleFetch } from "../config/moodleApi.js";

// ─── ONLINE — Catalogue ──────────────────────────────────────

/**
 * Liste les cours disponibles sur Moodle.
 * Proxy direct — rien n'est stocké en local.
 * Paramètres de recherche transmis à Moodle.
 *
 * @param {string} token
 * @param {object} opts  - { search?, categoryId?, page?, perPage? }
 */
export const getCatalogue = async (token, { search = "", categoryId, page = 0, perPage = 20 } = {}) => {
  const { data } = await moodleFetch("core_course_get_courses", {}, token);
  // Moodle renvoie le cours "site" (format=site) comme premier élément — le filtrer
  const realCourses = data.filter(course => course.format !== "site");

  return {
    total:   realCourses.length ?? 0,
    courses: (realCourses ?? []).map(_formatCatalogCourse),
  };
};

// ─── ONLINE — Enrollment ─────────────────────────────────────

/**
 * Inscrit l'utilisateur à un cours.
 * 1. Appel Moodle core_enrol_self_enrol_user
 * 2. Création/mise à jour CourseEnrollment local
 *
 * @param {object} prisma
 * @param {string} token
 * @param {number} courseServerId  - server_id du cours Moodle
 */
export const enrollCourse = async (prisma, token, courseServerId) => {
  // Vérifier si déjà inscrit localement
  const existing = await prisma.courseEnrollment.findUnique({
    where: { courseServerId },
  });
  if (existing?.enrolledOnServer) {
    const err = new Error("Already enrolled in this course");
    err.statusCode = 409;
    throw err;
  }

  // Appel Moodle — self-enrollment
  const { data } = await moodleFetch(
    "enrol_self_enrol_user",
    { courseid: courseServerId },
    token
  );

  // Moodle retourne { status: true/false, warnings: [] }
  if (data?.status !== true) {
    const warning = data?.warnings?.[0]?.message ?? "Enrollment failed on server";
    const err = new Error(warning);
    err.statusCode = 400;
    throw err;
  }

  // Enregistrer l'inscription en local
  const enrollment = await prisma.courseEnrollment.upsert({
    where:  { courseServerId },
    update: { enrolledOnServer: true, syncEnabled: true },
    create: { courseServerId, enrolledOnServer: true, syncEnabled: true },
  });

  return { enrollment, message: "Enrolled successfully. Run sync to download course content." };
};

/**
 * Désinscrit l'utilisateur d'un cours.
 * Note : Moodle ne permet pas le self-unenrollment via API dans tous les cas.
 * On désactive la sync locale dans tous les cas.
 *
 * @param {object} prisma
 * @param {string} token
 * @param {number} courseServerId
 */
export const unenrollCourse = async (prisma, token, courseServerId) => {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { courseServerId },
  });
  if (!enrollment) {
    const err = new Error("Not enrolled in this course");
    err.statusCode = 404;
    throw err;
  }

  // Désactiver la sync locale — le contenu reste en base mais n'est plus mis à jour
  await prisma.courseEnrollment.update({
    where: { courseServerId },
    data:  { syncEnabled: false },
  });

  return { message: "Course sync disabled. Local data retained. Contact your administrator to unenroll on the server." };
};

// ─── OFFLINE — Lecture locale ────────────────────────────────

export const getLocalCourses = async (prisma) => {
  // Retourner uniquement les cours dont on a une inscription active
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
      // Sections avec leurs modules dans l'ordre
      sections: {
        orderBy: { sectionIndex: "asc" },
        include: {
          modules: {
            orderBy: { sortOrder: "asc" },
            include: { resources: true },
          },
        },
      },
      quizzes:     { orderBy: { name: "asc" } },
      assignments: { orderBy: { dueDate: "asc" } },
      grades:      true,
    },
  });
  if (!course) {
    const err = new Error("Course not found locally. Run sync first.");
    err.statusCode = 404;
    throw err;
  }
  return course;
};

export const getLocalQuizzesByCourse = async (prisma, localCourseId) => {
  return prisma.quiz.findMany({
    where:   { courseId: localCourseId },
    include: { questions: { orderBy: { slot: "asc" } } },
    orderBy: { name: "asc" },
  });
};

export const getLocalAssignmentsByCourse = async (prisma, localCourseId) => {
  return prisma.assignment.findMany({
    where:   { courseId: localCourseId },
    include: { submissions: true },
    orderBy: { dueDate: "asc" },
  });
};

export const getLocalResourcesByCourse = async (prisma, localCourseId) => {
  return prisma.resource.findMany({
    where:   { courseId: localCourseId },
    orderBy: { name: "asc" },
  });
};

export const getLocalGradesByCourse = async (prisma, localCourseId) => {
  return prisma.grade.findMany({
    where: { courseId: localCourseId },
  });
};


export const getLocalSectionsByCourse = async (prisma, localCourseId) => {
  return prisma.section.findMany({
    where:   { courseId: localCourseId },
    orderBy: { sectionIndex: "asc" },
    include: {
      modules: {
        orderBy:  { sortOrder: "asc" },
        include:  { resources: true },
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