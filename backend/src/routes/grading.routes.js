import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import * as gradingController from "../controllers/grading.controller.js";

const router = Router();

// Seul un Enseignant (ou Admin) a le droit d'appeler cette route pour noter
router.put("/:id/grade", authenticate, authorize("TEACHER", "ADMIN"), gradingController.gradeSubmission);

// Tout le monde peut récupérer les notes (le contrôleur filtre par rôle)
router.get("/", authenticate, gradingController.getGrades);

export default router;