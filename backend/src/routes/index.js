// src/routes/index.js
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import syncRoutes from "./sync.routes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ status: "ok", app: "Moodle Client" }));

router.use("/auth", authRoutes);
router.use("/sync", syncRoutes);

// Les routes cours, quiz, devoirs, annotations seront montées ici au fur et à mesure
// router.use("/courses",     courseRoutes);
// router.use("/quizzes",     quizRoutes);
// router.use("/assignments", assignmentRoutes);
// router.use("/annotations", annotationRoutes);

export default router;