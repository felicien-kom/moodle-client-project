import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import * as event from "../controllers/event.controller.js";

const router = Router();

// Toutes les routes event sont protégées — un user doit être connecté
// GET /api/events          → liste tous les events locaux
router.get("/", authenticate, event.listEvents);

// GET /api/events/:id      → un event précis
router.get("/:id", authenticate, event.getEvent);

export default router;