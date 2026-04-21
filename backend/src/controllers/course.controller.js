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

// GET /api/courses
export const getLocalCourses = async (req, res) => {
  const courses = await courseService.getLocalCourses(req.prisma);
  res.json({ courses });
};

// GET /api/courses/:id
export const getLocalCourseById = async (req, res) => {
  const course = await courseService.getLocalCourseById(req.prisma, Number(req.params.id));
  res.json({ course });
};

// GET /api/courses/:id/quizzes
export const getLocalQuizzes = async (req, res) => {
  const quizzes = await courseService.getLocalQuizzesByCourse(req.prisma, Number(req.params.id));
  res.json({ quizzes });
};

// GET /api/courses/:id/assignments
export const getLocalAssignments = async (req, res) => {
  const assignments = await courseService.getLocalAssignmentsByCourse(req.prisma, Number(req.params.id));
  res.json({ assignments });
};

// GET /api/courses/:id/resources
export const getLocalResources = async (req, res) => {
  const resources = await courseService.getLocalResourcesByCourse(req.prisma, Number(req.params.id));
  res.json({ resources });
};

// GET /api/courses/:id/grades
export const getLocalGrades = async (req, res) => {
  const grades = await courseService.getLocalGradesByCourse(req.prisma, Number(req.params.id));
  res.json({ grades });
};

// GET /api/courses/:id/sections
export const getLocalSections = async (req, res) => {
  const sections = await courseService.getLocalSectionsByCourse(req.prisma, Number(req.params.id));
  res.json({ sections });
};