// src/sync/pull/pullEvents.js
//
// Responsabilité : fetcher tous les events Moodle de l'utilisateur
// et les upsert dans la user DB locale (SQLite via Prisma).
//
// API Moodle utilisée : core_calendar_get_calendar_events
//
// Particularités vs pullCourses :
//   - L'API ne supporte pas la pagination (on reçoit tout d'un coup)
//   - Les events n'ont pas de "timemodified" fiable sur toutes les versions
//     Moodle → on utilise timemodified si présent, sinon timestart comme fallback
//   - eventtype côté Moodle est une string ("due", "site", "user"...)
//     mais notre schema Prisma utilise un enum EventType → on mappe
//   - groupid et categoryid valent 0 (pas null) quand absents → on normalise à null
//   - courseId dans notre DB pointe vers une Course locale (relation Prisma)
//     → on vérifie que le cours existe localement avant de le lier

import { moodleFetch } from "../../config/moodleApi.js";
import { diagnose, diagnoseNew, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

// ─── Mapping eventtype Moodle → enum Prisma ──────────────────
//
// Moodle envoie des strings libres, notre schema a un enum strict.
// On mappe proprement plutôt que de stocker la string brute.
// "SITE" est la valeur par défaut si on reçoit quelque chose d'inconnu.

const MOODLE_EVENTTYPE_MAP = {
  site:     "SITE",
  user:     "USER",
  course:   "COURSE",
  group:    "GROUP",
  due:      "DUE",      // deadline d'un assignment
  open:     "OPEN",     // ouverture d'un quiz
  close:    "CLOSE",    // fermeture d'un quiz
};

const mapEventType = (moodleType) =>
  MOODLE_EVENTTYPE_MAP[moodleType?.toLowerCase()] ?? "SITE";

// ─── Mapping format Moodle → string lisible ──────────────────
//
// Moodle retourne un entier pour le format de description.
// On le convertit en string pour que le front sache comment rendre le contenu.

const FORMAT_MAP = {
  0: "MOODLE",   // format auto Moodle
  1: "HTML",
  2: "PLAIN",
  4: "MARKDOWN",
};

const mapFormat = (formatInt) => FORMAT_MAP[formatInt] ?? "HTML";

// ─── Normalisation des IDs Moodle ────────────────────────────
//
// Moodle retourne 0 (zéro) quand un champ ID est absent/non applicable.
// Notre schema attend null pour les champs optionnels (Int?).
// Règle : si la valeur est 0 ou falsy → null

const nullIfZero = (val) => (val && val !== 0 ? val : null);

// ─── pullEvents ──────────────────────────────────────────────

export const pullEvents = async ({ prisma, token, moodleUserId, cursor, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "events", status: "start" });

  // Garde-fou : si on n'a pas l'ID Moodle de l'user, on ne peut rien fetcher
  if (!moodleUserId) {
    emitter.emit("progress", { step: "PULL", entity: "events", status: "done", pulled: 0 });
    return { pulled: 0, conflicts: 0 };
  }

  // 1. Récupérer tous les events depuis Moodle
  const serverEvents = await _fetchAllEvents(token, moodleUserId);

  // 2. Récupérer une fois les courseIds locaux existants
  //    → évite N requêtes dans la boucle pour vérifier l'existence d'un cours
  //    → un event dont le cours n'existe pas localement aura courseId = null
  const localCourses = await prisma.course.findMany({
    select: { id: true, server_id: true },
  });

  // Map server_id → id local  (ex: { 5: 1, 12: 2 })
  // Utilisé pour résoudre la relation courseId dans la user DB
  const courseServerIdToLocalId = new Map(
    localCourses.map((c) => [c.server_id, c.id])
  );

  let pulled = 0;
  let conflicts = 0;

  for (const serverEvent of serverEvents) {
    // timemodified n'est pas toujours fiable dans les vieilles versions Moodle
    // → si absent ou 0, on replie sur timestart (le seul timestamp garanti)
    const serverTimemodified = serverEvent.timemodified || serverEvent.timestart;

    // Chercher l'event en base locale par son server_id (clé de rapprochement)
    const local = await prisma.event.findFirst({
      where: { server_id: serverEvent.id },
    });

    let action;

    if (!local) {
      // Cas : l'event n'existe pas encore en local → toujours créer
      action = diagnoseNew();
    } else {
      // Cas : l'event existe déjà localement
      // Si déjà synced et que last_synced_at est récent → skip (pas de changement)
      if (local.sync_status === "SYNCED" && local.last_synced_at >= cursor) continue;

      // Demander à diagnose.js de comparer timestamps local vs serveur
      action = diagnose(local, serverTimemodified, cursor);

      if (action === SyncCase.CONFLICT) {
        // Pour les events, le serveur a toujours raison (données calendrier = source of truth Moodle)
        // On ne permet pas à l'user de modifier les events localement
        action = resolveConflict("event"); // retourne SyncCase.PULL
        conflicts++;
        emitter.emit("progress", {
          step: "CONFLICT",
          entity: "event",
          id: serverEvent.id,
          resolution: action,
        });
      }
    }

    // 3. Si la décision est PULL → upsert en base locale
    if (action === SyncCase.PULL) {
      // Résoudre le courseId local à partir du server_id Moodle
      // Si le cours n'est pas encore synchronisé localement → null
      // (l'event sera quand même sauvegardé, juste sans relation de cours)
      const localCourseId = serverEvent.courseid
        ? (courseServerIdToLocalId.get(serverEvent.courseid) ?? null)
        : null;

      // Construire le payload commun (create + update partagent les mêmes champs)
      const payload = {
        name:                serverEvent.name,
        description:         serverEvent.description ?? null,
        format:              mapFormat(serverEvent.format),
        categoryId:          nullIfZero(serverEvent.categoryid),
        courseId:            localCourseId,
        groupId:             nullIfZero(serverEvent.groupid),
        userId:              nullIfZero(serverEvent.userid),
        eventType:           mapEventType(serverEvent.eventtype),
        timestart:           serverEvent.timestart,
        timeduration:        serverEvent.timeduration ?? null,
        visible:             Boolean(serverEvent.visible),
        location:            serverEvent.location || null,
        server_timemodified: serverTimemodified,
        sync_status:         "SYNCED",
        last_synced_at:      serverTimemodified,
      };

      await prisma.event.upsert({
        where:  { server_id: serverEvent.id },
        update: payload,
        create: {
          ...payload,
          server_id: serverEvent.id,
        },
      });

      pulled++;
      emitter.emit("progress", {
        step:   "PULL",
        entity: "event",
        id:     serverEvent.id,
        name:   serverEvent.name,
      });
    }
  }

  emitter.emit("progress", {
    step: "PULL", entity: "events", status: "done", pulled, conflicts,
  });

  return { pulled, conflicts };
};

// ─── _fetchAllEvents ─────────────────────────────────────────
//
// Différence majeure avec pullCourses : core_calendar_get_calendar_events
// ne pagine pas — on reçoit tous les events en une seule requête.
//

const _fetchAllEvents = async (token, moodleUserId) => {
  // Essayer avec l'API originale mais avec les bons paramètres
  const { data } = await moodleFetch(
    "core_calendar_get_calendar_events",
    {
      // Paramètres minimaux pour éviter l'erreur
    },
    token
  );

  // L'API retourne { events: [...], warnings: [...] }
  // On retourne seulement le tableau d'events
  if (!Array.isArray(data?.events)) return [];

  // Filtrer les events sans id valide (cas défensif)
  return data.events.filter((e) => e.id && e.timestart);
};