// src/routes/course.routes.js
import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import * as course from "../controllers/course.controller.js";

const router = Router();

router.use(authenticate);

// ── Online (nécessite connexion Moodle) ──────────────────────
router.get("/catalogue",             course.getCatalogue);       // GET /api/courses/catalogue
router.post("/:serverId/enroll",     course.enrollCourse);       // POST /api/courses/:serverId/enroll
router.delete("/:serverId/enroll",   course.unenrollCourse);     // DELETE /api/courses/:serverId/enroll

// ── Offline (lecture locale) ─────────────────────────────────
router.get("/",                      course.getLocalCourses);    // GET /api/courses
router.get("/:id",                   course.getLocalCourseById); // GET /api/courses/:id
router.get("/:id/quizzes",           course.getLocalQuizzes);    // GET /api/courses/:id/quizzes
router.get("/:id/assignments",       course.getLocalAssignments);// GET /api/courses/:id/assignments
router.get("/:id/resources",         course.getLocalResources);  // GET /api/courses/:id/resources
router.get("/:id/sections",          course.getLocalSections);   // GET /api/courses/:id/sections (sections + modules + resources)
router.get("/:id/grades",            course.getLocalGrades);     // GET /api/courses/:id/grades

export default router;