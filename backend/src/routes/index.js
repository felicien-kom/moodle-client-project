// src/routes/index.js
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import syncRoutes from "./sync.routes.js";
import courseRoutes from "./course.routes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ status: "ok", app: "Moodle Client" }));

router.use("/auth", authRoutes);
router.use("/courses", courseRoutes);
router.use("/sync", syncRoutes);

// Les routes cours, quiz, devoirs : à monter plus tard
// router.use("/quizzes",     quizRoutes);
// router.use("/assignments", assignmentRoutes);
// router.use("/annotations", annotationRoutes);

export default router;