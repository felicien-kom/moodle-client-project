// src/services/assignment.service.js
import fs from "fs";
import path from "path";
import { getUserMediaDir, getUserSubmissionsDir } from "../utils/storage.js";

export const saveLocalDraft = async (prisma, userEmail, localAssignId, text, files) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: localAssignId } });
  if (!assignment) throw new Error("Assignment not found");

  const localUser = await prisma.localUser.findFirst();
  const moodleUserId = localUser?.moodleUserId ?? null;

  if (assignment.requiresText && text?.trim()) {
    const wordCount = text.trim().split(/\s+/).length;
    if (assignment.wordLimit && wordCount > assignment.wordLimit) {
      const err = new Error(`Limite de mots dépassée. Maximum : ${assignment.wordLimit}`);
      err.statusCode = 400; throw err;
    }
  }

  if (files?.length > 0) {
    if (assignment.maxFiles && files.length > assignment.maxFiles) {
      const err = new Error(`Trop de fichiers. Maximum : ${assignment.maxFiles}`);
      err.statusCode = 400; throw err;
    }
    const maxBytes = assignment.maxFileSize || Infinity;
    if (files.some(f => f.size > maxBytes)) {
      const err = new Error("Un ou plusieurs fichiers dépassent la taille maximale autorisée.");
      err.statusCode = 400; throw err;
    }
  }

  let submission = await prisma.assignmentSubmission.findFirst({
    where: {
      assignmentId: localAssignId,
      ...(moodleUserId ? { moodleUserId } : {}),
    },
  });

  if (submission && (submission.state === "SUBMITTED" || submission.state === "GRADED")) {
    const err = new Error("Cannot edit a submitted assignment.");
    err.statusCode = 403; throw err;
  }

  submission = await prisma.assignmentSubmission.upsert({
    where: { id: submission?.id || -1 },
    update: {
      submissionText: text ?? "",
      state: "DRAFT",
      sync_status: "PENDING_PUSH",
      ...(moodleUserId ? { moodleUserId } : {}),
    },
    create: {
      assignmentId: localAssignId,
      submissionText: text ?? "",
      state: "DRAFT",
      sync_status: "PENDING_PUSH",
      ...(moodleUserId ? { moodleUserId } : {}),
    },
  });

  // Sauvegarde physique des fichiers locaux dans le sous-dossier
  if (files && files.length > 0) {
    const submissionsDir = getUserSubmissionsDir(userEmail);
    
    for (const file of files) {
      const filenameRaw = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      const relativeFilename = `sub_${submission.id}_${Date.now()}_${filenameRaw}`;
      const fullPath = path.join(submissionsDir, relativeFilename);
      
      // Écriture physique dans data/media/email/submissions/
      fs.writeFileSync(fullPath, file.buffer);

      await prisma.localFile.create({
        data: {
          submissionId: submission.id,
          filename:     file.originalname,
          mimeType:     file.mimetype,
          fileSize:     file.size,
          // IMPORTANT: On stocke le chemin relatif depuis le dossier racine de l'user
          // ce qui donnera "submissions/sub_X_..."
          localPath:    path.join("submissions", relativeFilename).replace(/\\/g, "/"),
          sync_status:  "PENDING_PUSH" 
        }
      });
    }
  }

  return submission;
};

export const submitAssignmentLocally = async (prisma, localAssignId) => {
  const localUser = await prisma.localUser.findFirst();
  const moodleUserId = localUser?.moodleUserId ?? null;

  const assignment = await prisma.assignment.findUnique({
    where: { id: localAssignId },
    include: {
      submissions: {
        where: moodleUserId ? { moodleUserId } : undefined,
        include: { submittedFiles: true },
      },
    },
  });

  if (!assignment) {
    const err = new Error("Assignment not found");
    err.statusCode = 404; throw err;
  }

  let submission = assignment.submissions[0];

  if (!submission) {
    const err = new Error("Aucun contenu à remettre. Ajoutez du texte ou un fichier.");
    err.statusCode = 400; throw err;
  }

  if (assignment.requiresText && !submission.submissionText?.trim()) {
    const err = new Error("Une réponse textuelle est requise pour ce devoir.");
    err.statusCode = 400; throw err;
  }

  if (assignment.requiresFile && submission.submittedFiles.length === 0) {
    const err = new Error("Au moins un fichier est requis pour ce devoir.");
    err.statusCode = 400; throw err;
  }

  return prisma.assignmentSubmission.update({
    where: { id: submission.id },
    data:  { state: "SUBMITTED", sync_status: "PENDING_PUSH" },
  });
};