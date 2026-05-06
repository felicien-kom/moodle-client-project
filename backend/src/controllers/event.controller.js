// Express 5 — pas de try/catch, les erreurs remontent automatiquement

import * as eventService from "../services/event.service.js";
import { validateListEvents } from "../validators/event.validator.js";

// GET /api/events — Liste les events depuis la DB locale
export const listEvents = async (req, res) => {
  // req.query peut contenir des filtres : courseId, from, to, type
  const { courseId, from, to } = req.query;

  const { errors } = validateListEvents({ courseId, from, to });
  if (errors.length) return res.status(400).json({ errors });

  // req.prisma → client Prisma de l'user connecté, injecté par authenticate
  const events = await eventService.listEvents(req.prisma, { courseId, from, to });
  res.json({ events });
};

// GET /api/events/:id — Un event précis
export const getEvent = async (req, res) => {
  const { id } = req.params;

  const event = await eventService.getEvent(req.prisma, id);
  res.json({ event });
};