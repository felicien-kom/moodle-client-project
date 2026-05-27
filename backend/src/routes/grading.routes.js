import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import * as gradingController from "../controllers/grading.controller.js";

const router = Router();

// Seul un Enseignant (ou Admin) a le droit d'appeler cette route
router.put("/:id/grade", authenticate, authorize("TEACHER", "ADMIN"), gradingController.gradeSubmission);

export default router;