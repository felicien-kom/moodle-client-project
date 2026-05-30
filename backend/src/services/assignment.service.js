// src/services/assignment.service.js
import fs from "fs";
import path from "path";
import { getUserMediaDir, getUserSubmissionsDir } from "../utils/storage.js";

export const saveLocalDraft = async (prisma, userEmail, localAssignId, text, files, moodleUserId) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: localAssignId } });
  if (!assignment) throw new Error("Assignment not found");

  // Validation métier stricte
  if (assignment.requiresText && text) {
    const wordCount = text.trim().split(/\s+/).length;
    if (assignment.wordLimit && wordCount > assignment.wordLimit) {
      const err = new Error(`Word limit exceeded. Maximum: ${assignment.wordLimit}`);
      err.statusCode = 400; throw err;
    }
  }

  if (assignment.requiresFile && files?.length > 0) {
    if (assignment.maxFiles && files.length > assignment.maxFiles) {
      const err = new Error(`Too many files. Maximum: ${assignment.maxFiles}`);
      err.statusCode = 400; throw err;
    }
    const maxBytes = assignment.maxFileSize || Infinity;
    if (files.some(f => f.size > maxBytes)) {
      const err = new Error("One or more files exceed the maximum allowed size.");
      err.statusCode = 400; throw err;
    }
  }

  // Enregistrement de la soumission (Écrase l'ancien brouillon local)
  // Enregistrement ou mise à jour de la soumission
  let submission = await prisma.assignmentSubmission.findFirst({ where: { assignmentId: localAssignId } });
  if (submission && submission.state === "SUBMITTED") {
    const err = new Error("Cannot edit a submitted assignment.");
    err.statusCode = 403; throw err;
  }

  submission = await prisma.assignmentSubmission.upsert({
    where: { id: submission?.id || -1 },
    update: { submissionText: text, state: "DRAFT", sync_status: "PENDING_PUSH", moodleUserId: moodleUserId },
    create: { assignmentId: localAssignId, submissionText: text, state: "DRAFT", sync_status: "PENDING_PUSH", moodleUserId: moodleUserId }
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
  const submission = await prisma.assignmentSubmission.findFirst({ where: { assignmentId: localAssignId } });
  
  if (!submission) {
    const err = new Error("No draft found to submit.");
    err.statusCode = 404; throw err;
  }

  return prisma.assignmentSubmission.update({
    where: { id: submission.id },
    data:  { state: "SUBMITTED", sync_status: "PENDING_PUSH" }
  });
};