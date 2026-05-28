// src/routes/calendar.routes.js
import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import * as calendarController from "../controllers/calendar.controller.js";

const router = Router();

// L'authentification est requise pour accéder à la base locale de l'étudiant
router.use(authenticate);

router.get("/", calendarController.getEvents);
router.post("/", calendarController.createEvent);
router.put("/:id", calendarController.updateEvent);
router.delete("/:id", calendarController.deleteEvent);

export default router;