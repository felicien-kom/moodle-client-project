// src/controllers/calendar.controller.js
import * as calendarService from "../services/calendar.service.js";
import { validateEvent } from "../validators/calendar.validator.js";

// GET /api/v1/events
export const getEvents = async (req, res) => {
  const events = await calendarService.getLocalEvents(req.prisma, req.query);
  res.json({ events });
};

// POST /api/v1/events
export const createEvent = async (req, res) => {
  const { name, description, timeStart, timeDuration, courseId } = req.body;
  
  const { errors, parsedStart, parsedDuration, parsedCourseId } = validateEvent({ name, timeStart, timeDuration, courseId });
  if (errors.length > 0) return res.status(400).json({ errors });

  const event = await calendarService.createLocalEvent(req.prisma, {
    name, description, parsedStart, parsedDuration, parsedCourseId
  });

  res.status(201).json({ message: "Événement créé localement.", event });
};

// PUT /api/v1/events/:id
export const updateEvent = async (req, res) => {
  const { name, description, timeStart, timeDuration, courseId } = req.body;
  const eventId = req.params.id;

  // On permet une mise à jour partielle, donc on ne valide que si les champs sont fournis
  const validationPayload = {
    name: name ?? "Keep_Name", // Bypass basique du required si non fourni
    timeStart: timeStart ?? 1, // Bypass basique du required si non fourni
    timeDuration, courseId
  };

  const { errors, parsedDuration, parsedCourseId } = validateEvent(validationPayload);
  
  if (errors.length > 0) return res.status(400).json({ errors });

  const updatedEvent = await calendarService.updateLocalEvent(req.prisma, eventId, {
    name, description, 
    parsedStart: timeStart ? Number(timeStart) : undefined, 
    parsedDuration, 
    parsedCourseId
  });

  res.json({ message: "Événement mis à jour localement.", event: updatedEvent });
};

// DELETE /api/v1/events/:id
export const deleteEvent = async (req, res) => {
  const result = await calendarService.deleteLocalEvent(req.prisma, req.params.id);
  res.json(result);
};