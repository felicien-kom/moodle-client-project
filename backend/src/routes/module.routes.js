// src/routes/module.routes.js
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middlewares/authenticate.js";
import * as moduleController from "../controllers/module.controller.js";

const router = Router();

// Configuration Multer : On stocke temporairement en mémoire, le service gérera l'écriture physique
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

// POST /api/modules/courses/:courseId/sections/:sectionId
router.post(
  "/courses/:courseId/sections/:sectionId",
  upload.array("files"), // Accepte plusieurs fichiers sous le champ "files"
  moduleController.createModule
);

export default router;
