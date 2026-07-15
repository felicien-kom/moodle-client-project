// src/routes/course.routes.js
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middlewares/authenticate.js";
import * as course from "../controllers/course.controller.js";
import * as fileController from "../controllers/file.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

// ── Online (nécessite connexion Moodle) ──────────────────────
router.get("/catalogue",             course.getCatalogue);
router.post("/:serverId/enroll",     course.enrollCourse);
router.delete("/:serverId/enroll",   course.unenrollCourse);

// ── Offline (lecture locale) ─────────────────────────────────
router.post("/", upload.single("image"), course.createLocalCourse); // Nouveau: CRUD Enseignant avec image
router.get("/",                      course.getLocalCourses);
router.get("/:id",                   course.getLocalCourseById);
router.get("/:id/assignments",       course.getLocalAssignments);
router.get("/:id/files",             course.getLocalFiles);   // Remplace /resources
router.get("/:id/sections",          course.getLocalSections); // Le Super-Endpoint
router.get("/:id/grades",            course.getLocalGrades);
router.get("/:id/events",            course.getLocalEvents);  // Nouveau
router.get("/:id/participants",      course.getLocalParticipants); // Participants

export default router;