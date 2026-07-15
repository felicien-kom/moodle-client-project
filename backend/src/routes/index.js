// src/routes/index.js
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import courseRoutes from "./course.routes.js";
import syncRoutes from "./sync.routes.js";
import fileRoutes from "./file.routes.js";
import assignmentRoutes from "./assignment.routes.js";
import calendarRoutes from "./calendar.routes.js";
import gradingRoutes from "./grading.routes.js";
import moduleRoutes from "./module.routes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ status: "ok", app: "Moodle Client" }));

router.use("/auth", authRoutes);
router.use("/courses", courseRoutes);
router.use("/sync", syncRoutes);
router.use("/files", fileRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/events", calendarRoutes);
router.use("/submissions", gradingRoutes);
router.use("/modules", moduleRoutes);

export default router;