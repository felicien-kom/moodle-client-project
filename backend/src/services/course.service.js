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

import fs from "fs";
import path from "path";
import { getUserMediaDir } from "../utils/storage.js";

export const createCourseLocally = async (prisma, userEmail, courseData, file) => {
  const { title, shortName, summary, categoryId, numSections } = courseData;

  let localImagePath = null;

  if (file) {
    const mediaDir = getUserMediaDir(userEmail);
    const coursesSubDir = path.join(mediaDir, "courses");
    if (!fs.existsSync(coursesSubDir)) {
      fs.mkdirSync(coursesSubDir, { recursive: true });
    }

    const filenameRaw = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const relativeFilename = `course_${Date.now()}_${filenameRaw}`;
    const fullPath = path.join(coursesSubDir, relativeFilename);
    
    fs.writeFileSync(fullPath, file.buffer);
    localImagePath = path.join("courses", relativeFilename).replace(/\\/g, "/");
  }

  const course = await prisma.course.create({
    data: {
      title,
      shortName: shortName || title.substring(0, 10).trim(),
      summary,
      categoryId,
      imageUrl: localImagePath,
      visible: true,
      sync_status: "PENDING_PUSH"
    }
  });

  // Création des sections
  const sectionsData = [];
  // Section 0 est généralement "Généralités"
  sectionsData.push({
    courseId: course.id,
    name: "Général",
    sectionIndex: 0,
    sync_status: "PENDING_PUSH"
  });

  for (let i = 1; i <= numSections; i++) {
    sectionsData.push({
      courseId: course.id,
      name: `Section ${i}`,
      sectionIndex: i,
      sync_status: "PENDING_PUSH"
    });
  }

  await prisma.section.createMany({ data: sectionsData });

  // Inscription automatique du créateur pour qu'il voit le cours
  const user = await prisma.localUser.findUnique({ where: { email: userEmail } });
  if (user) {
    await prisma.courseParticipant.create({
      data: {
        courseId: course.id,
        moodleUserId: user.moodleUserId || -1,
        fullname: user.name,
        email: user.email
      }
    });
    
    // Si nous voulons simuler l'enrollment local pour s'assurer qu'il s'affiche dans getLocalCourses
    // Par contre CourseEnrollment utilise courseServerId, qui est nul pour l'instant !
    // Donc getLocalCourses doit aussi retourner les cours créés localement (où server_id est null)
  }

  return prisma.course.findUnique({
    where: { id: course.id },
    include: { sections: true }
  });
};

export const getLocalCourses = async (prisma) => {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { syncEnabled: true },
    select: { courseServerId: true },
  });
  const serverIds = enrollments.map(e => e.courseServerId);

  return prisma.course.findMany({
    where: {
      OR: [
        { server_id: { in: serverIds } },
        { server_id: null } // Inclus les cours créés hors-ligne non encore synchronisés
      ]
    },
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
      submissions: {
        include: { submittedFiles: true },
      },
      introFiles: true,
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

export const getLocalParticipantsByCourse = async (prisma, localCourseId) => {
  return prisma.courseParticipant.findMany({
    where: { courseId: localCourseId },
    orderBy: { fullname: "asc" }
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