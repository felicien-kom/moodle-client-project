// src/sync/pull/pullAssignmentSubmissions.js
import { moodleFetch } from "../../config/moodleApi.js";
import { diagnose, diagnoseNew, SyncCase } from "../diagnose.js";
import { resolveConflict } from "../resolve.js";

export const pullAssignmentSubmissions = async ({ prisma, token, cursor, servertime, emitter }) => {
  emitter.emit("progress", { step: "PULL", entity: "submissions", status: "start" });

  const localUser = await prisma.localUser.findFirst();
  if (!localUser) return { pulled: 0, conflicts: 0 };

  const assignments = await prisma.assignment.findMany();
  let pulled = 0, conflicts = 0;

  for (const assign of assignments) {
    try {
      
      // ─── BRANCHE ÉTUDIANT (Zéro régression, on garde votre logique) ───
      if (localUser.role === "STUDENT") {
        const { data: result } = await moodleFetch("mod_assign_get_submission_status", { assignid: assign.server_id }, token);
        const lastAttempt = result.lastattempt;
        
        if (!lastAttempt || !lastAttempt.submission) continue;
        const sub = lastAttempt.submission;
        
        if (sub.status === "new") continue;

        await processSubmissionNode(prisma, assign.id, sub, localUser.moodleUserId, servertime, cursor);
        pulled++;
      } 
      
      // ─── BRANCHE ENSEIGNANT (On récupère toutes les copies) ───────────
      else if (localUser.role === "TEACHER" || localUser.role === "ADMIN") {
        const { data: result } = await moodleFetch("mod_assign_get_submissions", { assignmentids: [assign.server_id] }, token);
        const serverAssignments = result.assignments || [];
        
        for (const srvAssign of serverAssignments) {
          const submissions = srvAssign.submissions || [];
          
          for (const sub of submissions) {
            if (sub.status === "new") continue;

            // Ici, le sub.userid est l'ID de l'étudiant qui a rendu la copie
            await processSubmissionNode(prisma, assign.id, sub, sub.userid, servertime, cursor);
            pulled++;
          }
        }
      }

    } catch (err) {
      // Ignore si le devoir n'est pas accessible
    }
  }

  emitter.emit("progress", { step: "PULL", entity: "submissions", status: "done", pulled });
  return { pulled, conflicts };
};

/**
 * Fonction utilitaire commune pour upsert la soumission et ses fichiers.
 * C'est littéralement votre code d'origine, encapsulé pour être réutilisable.
 */
const processSubmissionNode = async (prisma, localAssignId, sub, studentMoodleUserId, servertime, cursor) => {
  const serverTimemodified = sub.timemodified ?? sub.numcreated ?? 0;
  
  const textPlugin = sub.plugins?.find(p => p.type === "onlinetext");
  const submissionText = textPlugin?.editorfields?.[0]?.text || null;
  
  const filePlugin = sub.plugins?.find(p => p.type === "file");
  const submittedFiles = filePlugin?.fileareas?.[0]?.files || [];

  const state = sub.status === "submitted" ? "SUBMITTED" : "DRAFT";

  // NOUVEAU: On cherche la soumission spécifique à CET étudiant pour CE devoir
  const local = await prisma.assignmentSubmission.findFirst({ 
    where: { assignmentId: localAssignId, moodleUserId: studentMoodleUserId } 
  });
  
  let action = local ? diagnose(local, serverTimemodified, cursor) : diagnoseNew();

  if (action === SyncCase.CONFLICT) {
    action = resolveConflict("assignment_submission"); // CLIENT gagne (Le prof/élève ne perd pas son hors-ligne)
  }

  if (action === SyncCase.PULL) {
    const savedSub = await prisma.assignmentSubmission.upsert({
      where: { id: local?.id || -1 },
      update: {
        moodleUserId:        studentMoodleUserId, // AJOUTÉ
        attemptNumber:       sub.attemptnumber ?? 0,
        submissionText,
        state,
        server_id:           sub.id,
        server_timemodified: serverTimemodified,
        sync_status:         "SYNCED",
        last_synced_at:      servertime,
      },
      create: {
        assignmentId:        localAssignId,
        moodleUserId:        studentMoodleUserId, // AJOUTÉ
        attemptNumber:       sub.attemptnumber ?? 0,
        submissionText,
        state,
        server_id:           sub.id,
        server_timemodified: serverTimemodified,
        sync_status:         "SYNCED",
        last_synced_at:      servertime,
      }
    });

    for (const f of submittedFiles) {
      if (!f.fileurl) continue;
      
      await prisma.localFile.upsert({
        where: { moodleUrl: f.fileurl },
        update: { 
          submissionId:        savedSub.id, 
          filename:            f.filename, 
          mimeType:            f.mimetype ?? null,
          fileSize:            f.filesize ?? null,
          server_timemodified: serverTimemodified,
          last_synced_at:      servertime 
        },
        create: { 
          submissionId:        savedSub.id, 
          filename:            f.filename, 
          moodleUrl:           f.fileurl, 
          mimeType:            f.mimetype ?? null,
          fileSize:            f.filesize ?? null,
          sync_status:         "SYNCED",
          server_timemodified: serverTimemodified,
          last_synced_at:      servertime 
        }
      });
    }
  }
};