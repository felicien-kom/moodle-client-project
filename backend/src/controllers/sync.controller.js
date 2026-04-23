// src/controllers/sync.controller.js
//
// Deux Maps en mémoire :
//   runningSyncs : email → syncId   — syncs en cours (protection contre doublons)
//   activeSyncs  : syncId → état    — état et events de chaque sync (pour SSE + replay)

import { v4 as uuidv4 } from "uuid";
import { SyncEngine } from "../sync/engine.js";

// ─── État en mémoire ─────────────────────────────────────────

// Protection : un seul sync actif par utilisateur à la fois
// email → syncId
const runningSyncs = new Map();

// Données de chaque sync : events passés (replay), clients SSE connectés, statut
// syncId → { events: Array, clients: Set<Response>, status: string }
const activeSyncs = new Map();

// ─── POST /api/sync/start ────────────────────────────────────

export const startSync = async (req, res) => {
  const { email } = req.user;

  // Vérifier qu'une sync ne tourne pas déjà pour cet utilisateur
  if (runningSyncs.has(email)) {
    const existingSyncId = runningSyncs.get(email);
    return res.status(409).json({
      error: "A sync is already running for this user. Connect to the existing sync to follow progress.",
      syncId: existingSyncId,
    });
  }

  const syncId = uuidv4();

  // Enregistrer dans les deux Maps avant de lancer le moteur
  runningSyncs.set(email, syncId);
  activeSyncs.set(syncId, {
    events:  [],
    clients: new Set(),
    status:  "running",
  });

  // Lancer le moteur en arrière-plan — pas d'await
  const engine = new SyncEngine(email);

  engine.on("progress", (event) => {
    _broadcast(syncId, "progress", event);
  });

  engine.on("done", (event) => {
    _broadcast(syncId, "done", event);
    activeSyncs.get(syncId).status = "done";
    runningSyncs.delete(email); // libérer le verrou
  });

  engine.on("error", (event) => {
    _broadcast(syncId, "error", event);
    activeSyncs.get(syncId).status = "error";
    runningSyncs.delete(email); // libérer le verrou même en cas d'erreur
  });

  engine.run().catch(() => {
    // Erreur déjà émise via event "error" — s'assurer que le verrou est libéré
    runningSyncs.delete(email);
  });

  res.status(202).json({ syncId });
};

// ─── GET /api/sync/:id/progress — stream SSE ─────────────────

export const getSyncProgress = (req, res) => {
  const { id } = req.params;
  const sync = activeSyncs.get(id);

  if (!sync) {
    return res.status(404).json({ error: "Sync session not found" });
  }

  // Headers SSE
  res.setHeader("Content-Type",      "text/event-stream");
  res.setHeader("Cache-Control",     "no-cache");
  res.setHeader("Connection",        "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // désactive le buffering nginx/proxy

  res.flushHeaders();

  // Rejouer tous les events passés pour les clients arrivés en retard
  for (const { event, data } of sync.events) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  // Si la sync est déjà terminée, fermer immédiatement après le replay
  if (sync.status === "done" || sync.status === "error") {
    return res.end();
  }

  // Enregistrer ce client pour les futurs events
  sync.clients.add(res);

  // Nettoyage à la déconnexion du client SSE
  req.on("close", () => {
    sync.clients.delete(res);
  });
};

// ─── GET /api/sync/logs ──────────────────────────────────────

export const getSyncLogs = async (req, res) => {
  const logs = await req.prisma.syncLog.findMany({
    orderBy: { startedAt: "desc" },
    take:    50,
  });
  res.json({ logs });
};

// ─── GET /api/sync/status ────────────────────────────────────
// Permet au frontend de savoir si une sync tourne déjà avant d'en lancer une

export const getSyncStatus = (req, res) => {
  const { email } = req.user;
  const runningSyncId = runningSyncs.get(email) ?? null;

  res.json({
    running:  runningSyncId !== null,
    syncId:   runningSyncId,
  });
};

// ─── Helper interne ──────────────────────────────────────────

const _broadcast = (syncId, event, data) => {
  const sync = activeSyncs.get(syncId);
  if (!sync) return;

  // Stocker pour replay des futurs clients SSE
  sync.events.push({ event, data });

  // Envoyer à tous les clients SSE actuellement connectés
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sync.clients) {
    client.write(message);
  }
};