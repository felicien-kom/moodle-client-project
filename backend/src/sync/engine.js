// src/sync/engine.js
// Orchestrateur de la synchronisation.
// Hérite EventEmitter — émet "progress", "done", "error".
//
// MOODLE_URL vient de env — pas de paramètre moodleSiteUrl nulle part.
// Servertime = header HTTP "Date" de la réponse de core_webservice_get_site_info.
// Ordre invariant : PUSH d'abord, PULL ensuite.

import EventEmitter from "events";
import { getDb, masterDb } from "../config/db.js";
import { moodleFetch, checkMoodleReachable, isMoodleTokenError } from "../config/moodleApi.js";
import { getCursor, saveCursor } from "./cursor.js";
// import { pushAll } from "./push/index.js"; // PUSH désactivé pendant les tests pull
import { pullAll } from "./pull/index.js";
import { pushAll } from "./push/index.js";

export class SyncEngine extends EventEmitter {
  /**
   * @param {string} userEmail - email de l'utilisateur à synchroniser
   * @param {string} [dbRelPath] - chemin relatif de la base (lu depuis master.db si absent)
   */
  constructor(userEmail, dbRelPath) {
    super();
    this.userEmail = userEmail;
    // Utiliser le chemin stocké en master.db si fourni, sinon le recalculer
    this.prisma = getDb(userEmail, dbRelPath);
    this.servertime = null;
  }

  async run() {
    const log = await this._startLog();

    try {
      // 1. Récupérer LocalUser
      const user = await this.prisma.localUser.findFirst();
      if (!user)           throw new Error("No local user found in this database.");
      if (!user.moodleToken) throw new Error("No Moodle token. Please create your profile first.");

      // 2. Vérifier que le serveur Moodle est joignable
      this.emit("progress", { phase: "INIT", progress: 5, status: "checking_server" });
      const reachable = await checkMoodleReachable();
      if (!reachable) throw new Error("Moodle server is not reachable. Check your connection.");

      // 3. Valider le token + obtenir le servertime depuis le header HTTP "Date"
      this.emit("progress", { phase: "INIT", progress: 10, status: "fetching_server_time" });

      let siteInfo, servertime;
      try {
        // moodleFetch retourne { data, servertime } — servertime vient du header Date
        ({ data: siteInfo, servertime } = await moodleFetch(
          "core_webservice_get_site_info",
          {},
          user.moodleToken
        ));
      } catch (err) {
        if (isMoodleTokenError(err)) {
          throw new Error("Moodle token expired. Refresh it via POST /api/auth/server-token/refresh");
        }
        throw err;
      }

      this.servertime = servertime;

      this.emit("progress", {
        phase:       "INIT",
        progress:    15,
        status:     "ready",
        servertime: this.servertime,
        role:       user.role,
        siteName:   siteInfo.sitename,
      });

      // 4. Curseur de la dernière sync
      const cursor = await getCursor(this.prisma, user.id);
      this.emit("progress", { phase: "INIT", progress: 20, cursor, servertime: this.servertime });
      // throw Error('Erreur volontaire');

      // 5. Contexte partagé passé aux fonctions pull/push
      // moodleSiteUrl absent : moodleFetch le lit depuis env.MOODLE_URL
      const ctx = {
        prisma:       this.prisma,
        token:        user.moodleToken,
        userId:       user.id,
        moodleUserId: user.moodleUserId,
        role:         user.role,
        cursor,
        servertime:   this.servertime,
        emitter:      this,
      };

      let totalPushed = 0;
      let totalPulled = 0;
      let totalConflicts = 0;

      // Compteurs pour progression incrémentale
      const pullSteps = ["profile", "courses", "courseParticipants", "calendarEvents", "courseStructure", "fileResources", "folderResources", "externalUrls", "assignments", "assignmentSubmissions", "grades"]; // 11
      const pushSteps = ["profile", "calendarEvents", "assignmentSubmissions", "assignmentGrades"]; // 4
      let pullCompletedCount = 0;
      let pushCompletedCount = 0;

      // Listener temporaire pour les événements détaillés de pull/push
      const onProgress = (event) => {
        // Convertir les événements step en événements phase avec progression incrémentale
        if (event.step === "PULL" && event.status === "done") {
          pullCompletedCount++;
          const progressVal = 35 + (pullCompletedCount / pullSteps.length) * 58; // 35% → 93%
          const phaseLabel = this._getEntityLabel(event.entity);
          this.emit("progress", {
            phase: "PULL",
            progress: Math.round(progressVal),
            status: "processing",
            entity: phaseLabel,
            pulled: event.pulled,
            message: `Récupération ${phaseLabel}: ${event.pulled} élément${event.pulled > 1 ? 's' : ''}`
          });
        } else if (event.step === "PUSH" && event.status === "done") {
          pushCompletedCount++;
          const progressVal = 5 + (pushCompletedCount / pushSteps.length) * 23; // 5% → 28%
          const phaseLabel = this._getEntityLabel(event.entity);
          this.emit("progress", {
            phase: "PUSH",
            progress: Math.round(progressVal),
            status: "processing",
            entity: phaseLabel,
            pushed: event.pushed,
            message: `Envoi ${phaseLabel}: ${event.pushed} élément${event.pushed > 1 ? 's' : ''}`
          });
        }
      };

      // Ajouter le listener temporaire
      this.on("progress", onProgress);

      // --- PHASE 1 : PUSH (Envoi des modifications locales vers Moodle) ---
      this.emit("progress", { phase: "PUSH", progress: 5, status: "starting", message: "Préparation envoi..." });
      
      const pushResult = await pushAll(ctx);
      totalPushed    += pushResult.pushed;
      totalConflicts += pushResult.conflicts;
      
      this.emit("progress", { phase: "PUSH", progress: 30, status: "completed", pushed: totalPushed, message: `Envoi complété: ${totalPushed} élément${totalPushed > 1 ? 's' : ''}` });

      // --- PHASE 2 : PULL (Récupération des nouveautés du serveur) ---
      this.emit("progress", { phase: "PULL", progress: 35, status: "starting", message: "Préparation récupération..." });
      
      const pullResult = await pullAll(ctx);
      totalPulled    += pullResult.pulled;
      totalConflicts += pullResult.conflicts;
      
      this.emit("progress", { phase: "PULL", progress: 95, status: "completed", pulled: totalPulled, message: `Récupération complétée: ${totalPulled} élément${totalPulled > 1 ? 's' : ''}` });

      // Retirer le listener temporaire
      this.removeListener("progress", onProgress);

      // 6. Sauvegarder le nouveau curseur
      const newCursor = await saveCursor(this.prisma, user.id, this.servertime);

      await this._finishLog(log.id, "SUCCESS", totalPushed, totalPulled, totalConflicts);

      const result = { pushed: totalPushed, pulled: totalPulled, conflicts: totalConflicts, newCursor };
      this.emit("done", result);
      return result;

    } catch (err) {
      await this._finishLog(log.id, "FAILED", 0, 0, 0, err.message);
      this.emit("error", { message: err.message });
      throw err;
    }
  }

  async _startLog() {
    const user = await this.prisma.localUser.findFirst();
    return this.prisma.syncLog.create({
      data: { userId: user.id, status: "RUNNING" },
    });
  }

  async _finishLog(logId, status, pushed, pulled, conflicts, errorMessage = null) {
    await this.prisma.syncLog.update({
      where: { id: logId },
      data:  { status, pushed, pulled, conflicts, finishedAt: new Date(), errorMessage },
    });
  }

  _getEntityLabel(entity) {
    const labels = {
      "profile": "des informations",
      "courses": "des cours",
      "courseParticipants": "des participants",
      "calendarEvents": "des événements calendrier",
      "courseStructure": "de la structure",
      "fileResources": "des fichiers",
      "folderResources": "des dossiers",
      "externalUrls": "des liens externes",
      "assignments": "des devoirs",
      "assignmentSubmissions": "des remises",
      "grades": "des notes",
      "assignmentGrades": "des notes de devoir"
    };
    return labels[entity] || entity;
  }
}