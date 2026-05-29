// src/controllers/course.controller.js
import * as courseService from "../services/course.service.js";

// ─── ONLINE ──────────────────────────────────────────────────

// GET /api/courses/catalogue?search=&categoryId=&page=&perPage=
export const getCatalogue = async (req, res) => {
  const { search, categoryId, page, perPage } = req.query;
  const result = await courseService.getCatalogue(req.moodleToken, {
    search:     search     ?? "",
    categoryId: categoryId ? Number(categoryId) : undefined,
    page:       page       ? Number(page)       : 0,
    perPage:    perPage    ? Number(perPage)     : 20,
  });
  res.json(result);
};

// POST /api/courses/:serverId/enroll
export const enrollCourse = async (req, res) => {
  const courseServerId = Number(req.params.serverId);
  if (!courseServerId) return res.status(400).json({ error: "Invalid course server ID" });

  const result = await courseService.enrollCourse(req.prisma, req.moodleToken, courseServerId);
  res.status(201).json(result);
};

// DELETE /api/courses/:serverId/enroll
export const unenrollCourse = async (req, res) => {
  const courseServerId = Number(req.params.serverId);
  if (!courseServerId) return res.status(400).json({ error: "Invalid course server ID" });

  const result = await courseService.unenrollCourse(req.prisma, req.moodleToken, courseServerId);
  res.json(result);
};

// ─── OFFLINE ─────────────────────────────────────────────────
export const createLocalCourse = async (req, res) => {
  const { title, shortName, summary, categoryId, numSections } = req.body;
  const file = req.file; // Géré par Multer

  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }
  
  try {
    const course = await courseService.createCourseLocally(
      req.prisma,
      req.user.email,
      {
        title,
        shortName,
        summary,
        categoryId: categoryId ? Number(categoryId) : 1, // Par défaut 1 selon la demande
        numSections: numSections ? Number(numSections) : 1,
      },
      file
    );
    res.status(201).json({ message: "Course created locally. Ready for sync.", course });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

export const getLocalCourses = async (req, res) => {
  const courses = await courseService.getLocalCourses(req.prisma);
  res.json({ courses });
};

export const getLocalCourseById = async (req, res) => {
  const course = await courseService.getLocalCourseById(req.prisma, Number(req.params.id));
  res.json({ course });
};

export const getLocalAssignments = async (req, res) => {
  const assignments = await courseService.getLocalAssignmentsByCourse(req.prisma, Number(req.params.id));
  res.json({ assignments });
};

// Remplace getLocalResources
export const getLocalFiles = async (req, res) => {
  const files = await courseService.getLocalFilesByCourse(req.prisma, Number(req.params.id));
  res.json({ files });
};

export const getLocalGrades = async (req, res) => {
  const grades = await courseService.getLocalGradesByCourse(req.prisma, Number(req.params.id));
  res.json({ grades });
};

export const getLocalSections = async (req, res) => {
  const sections = await courseService.getLocalSectionsByCourse(req.prisma, Number(req.params.id));
  res.json({ sections });
};

// Nouvel endpoint pour le calendrier
export const getLocalEvents = async (req, res) => {
  const events = await courseService.getLocalEventsByCourse(req.prisma, Number(req.params.id));
  res.json({ events });
};