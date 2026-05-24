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
      this.emit("progress", { step: "INIT", status: "checking_server" });
      const reachable = await checkMoodleReachable();
      if (!reachable) throw new Error("Moodle server is not reachable. Check your connection.");

      // 3. Valider le token + obtenir le servertime depuis le header HTTP "Date"
      this.emit("progress", { step: "INIT", status: "fetching_server_time" });

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
        step:       "INIT",
        status:     "ready",
        servertime: this.servertime,
        role:       user.role,
        siteName:   siteInfo.sitename,
      });

      // 4. Curseur de la dernière sync
      const cursor = await getCursor(this.prisma, user.id);
      this.emit("progress", { step: "INIT", cursor, servertime: this.servertime });
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

      // PUSH — désactivé temporairement pour tester uniquement le pull
      // Décommenter quand le push sera implémenté et validé
      // this.emit("progress", { step: "PHASE", phase: "PUSH" });
      // const pushResult = await pushAll(ctx);
      // totalPushed    += pushResult.pushed;
      // totalConflicts += pushResult.conflicts;

      // PULL
      this.emit("progress", { step: "PHASE", phase: "PULL" });
      const pullResult = await pullAll(ctx);
      totalPulled    += pullResult.pulled;
      totalConflicts += pullResult.conflicts;

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
}