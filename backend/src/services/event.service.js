// src/services/event.service.js
// Les events sont en lecture seule (pull depuis Moodle, pas de push)
// On lit toujours depuis la DB locale — c'est le principe offline-first

// ─── listEvents ──────────────────────────────────────────────

export const listEvents = async (prisma, { courseId, from, to }) => {
  // Construire le filtre dynamiquement selon les query params reçus
  const where = {};

  if (courseId) {
    where.courseId = Number(courseId);
  }

  if (from || to) {
    where.timestart = {};
    // "from" et "to" sont des timestamps Unix envoyés par le client
    if (from) where.timestart.gte = Number(from);
    if (to)   where.timestart.lte = Number(to);
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { timestart: "asc" },
  });

  return events.map(_safeEvent);
};

// ─── getEvent ────────────────────────────────────────────────

export const getEvent = async (prisma, id) => {
  const event = await prisma.event.findUnique({
    where: { id: Number(id) },
  });

  if (!event) {
    const err = new Error("Event not found");
    err.statusCode = 404;
    throw err;
  }

  return _safeEvent(event);
};

// ─── Helper ──────────────────────────────────────────────────
// Même principe que _safeUser dans auth.service.js
// On filtre les champs internes (server_id, sync_status si sensible)

const _safeEvent = (event) => ({
  id:          event.id,
  name:        event.name,
  description: event.description,
  courseId:    event.courseId,
  timestart:   event.timestart,
  timeduration:event.timeduration,
  eventtype:   event.eventtype,
  modulename:  event.modulename,
  // server_id et sync_status sont des données internes de sync
  // on ne les expose pas au front sauf besoin explicite
});