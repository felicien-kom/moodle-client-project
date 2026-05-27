// src/sync/push/pushAssignmentGrades.js
import { moodleFetch } from "../../config/moodleApi.js";

export const pushAssignmentGrades = async ({ prisma, token, emitter }) => {
  emitter.emit("progress", { step: "PUSH", entity: "grades", status: "start" });

  // Sécurité absolue : Un étudiant ne doit jamais exécuter ce script
  const user = await prisma.localUser.findFirst();
  if (!user || user.role === "STUDENT") {
    return { pushed: 0, conflicts: 0 };
  }

  // Récupérer les soumissions corrigées par le prof en attente de synchronisation
  const pendingGrades = await prisma.assignmentSubmission.findMany({
    where: { 
      sync_status: "PENDING_PUSH",
      state: "GRADED", // Garantit qu'il s'agit bien d'une correction
      grade: { not: null }
    },
    include: { assignment: { select: { server_id: true } } }
  });

  let pushed = 0;

  for (const sub of pendingGrades) {
    try {
      if (!sub.assignment.server_id || !sub.moodleUserId) continue;
      
      // Appel de l'API Moodle pour enregistrer la note et le commentaire
      // ─── CORRECTION DE L'APPEL MOODLE ─────────────────────────────
      // Moodle est très strict sur le typage. Convertir la note en String.
      const gradeStr = sub.grade.toString();
      
      // L'attemptnumber à -1 cible la tentative en cours. 
      // S'il pose problème, essayez avec 0 ou retirez-le complètement s'il est optionnel.
      const attemptNum = sub.attemptNumber ?? -1;

      // Appel de l'API Moodle pour enregistrer la note et le commentaire
      await moodleFetch("mod_assign_save_grade", {
        assignmentid: sub.assignment.server_id,
        userid: sub.moodleUserId,
        grade: sub.grade,
        attemptnumber: sub.attemptNumber ?? -1,
        addattempt: 0,
        workflowstate: "graded",
        applytoall: 0, // <-- LA CORRECTION EST ICI : 1 (True) ou 0 (False) est requis
        plugindata: {
          assignfeedbackcomments_editor: {
            text: sub.feedback || "",
            format: 1 // Format HTML
          }
        }
      }, token);

      // Si Moodle accepte, on repasse le statut en SYNCED
      await prisma.assignmentSubmission.update({
        where: { id: sub.id },
        data: {
          sync_status: "SYNCED",
          last_synced_at: Math.floor(Date.now() / 1000)
        }
      });

      pushed++;
      emitter.emit("progress", { step: "PUSH", entity: "grade", localId: sub.id });

    } catch (err) {
      emitter.emit("progress", { step: "PUSH_ERROR", entity: "grade", localId: sub.id, error: err.message });
    }
  }

  emitter.emit("progress", { step: "PUSH", entity: "grades", status: "done", pushed });
  return { pushed, conflicts: 0 };
};