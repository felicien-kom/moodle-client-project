// src/services/calendar.service.js

export const getLocalEvents = async (prisma, filters = {}) => {
  const { courseId, startBefore, endAfter } = filters;

  // On exclut formellement les événements marqués comme supprimés
  const where = { isDeleted: false };

  if (courseId) where.courseId = parseInt(courseId);
  
  if (startBefore || endAfter) {
    where.timeStart = {};
    if (startBefore) where.timeStart.lte = parseInt(startBefore);
    if (endAfter) where.timeStart.gte = parseInt(endAfter);
  }

  return prisma.calendarEvent.findMany({
    where,
    orderBy: { timeStart: "asc" },
    include: { course: { select: { id: true, title: true } } }
  });
};

export const createLocalEvent = async (prisma, eventData) => {
  const { name, description, parsedStart, parsedDuration, parsedCourseId } = eventData;

  return prisma.calendarEvent.create({
    data: {
      name: name.trim(),
      description: description ? description.trim() : null,
      timeStart: parsedStart,
      timeDuration: parsedDuration,
      courseId: parsedCourseId || null,
      eventType: "user", // Forcé : L'étudiant ne crée que des événements personnels
      sync_status: "PENDING_PUSH",
    },
  });
};

export const updateLocalEvent = async (prisma, id, updateData) => {
  const localEvent = await prisma.calendarEvent.findUnique({ where: { id: parseInt(id) } });

  if (!localEvent || localEvent.isDeleted) {
    const err = new Error("Événement introuvable.");
    err.statusCode = 404; throw err;
  }

  if (localEvent.eventType !== "user") {
    const err = new Error("Vous ne pouvez modifier que vos événements personnels.");
    err.statusCode = 403; throw err;
  }

  const { name, description, parsedStart, parsedDuration, parsedCourseId } = updateData;

  return prisma.calendarEvent.update({
    where: { id: localEvent.id },
    data: {
      name: name !== undefined ? name.trim() : localEvent.name,
      description: description !== undefined ? description.trim() : localEvent.description,
      timeStart: parsedStart !== undefined ? parsedStart : localEvent.timeStart,
      timeDuration: parsedDuration !== undefined ? parsedDuration : localEvent.timeDuration,
      courseId: parsedCourseId !== undefined ? parsedCourseId : localEvent.courseId,
      sync_status: "PENDING_PUSH", // Déclenche une mise à jour au prochain PUSH
    },
  });
};

export const deleteLocalEvent = async (prisma, id) => {
  const localEvent = await prisma.calendarEvent.findUnique({ where: { id: parseInt(id) } });

  if (!localEvent || localEvent.isDeleted) {
    const err = new Error("Événement introuvable.");
    err.statusCode = 404; throw err;
  }

  if (localEvent.eventType !== "user") {
    const err = new Error("Vous ne pouvez supprimer que vos événements personnels.");
    err.statusCode = 403; throw err;
  }

  // S'il n'a pas de server_id, il n'existe pas sur Moodle. On peut le détruire physiquement.
  if (!localEvent.server_id) {
    await prisma.calendarEvent.delete({ where: { id: localEvent.id } });
    return { message: "Événement local supprimé définitivement." };
  }

  // Soft Delete : S'il existe sur Moodle, on le marque comme supprimé + PENDING_PUSH
  await prisma.calendarEvent.update({
    where: { id: localEvent.id },
    data: { 
      isDeleted: true, 
      sync_status: "PENDING_PUSH" 
    },
  });

  return { message: "Événement masqué et mis en file d'attente pour suppression sur le serveur." };
};