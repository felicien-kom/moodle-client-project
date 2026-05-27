export const gradeSubmissionLocal = async (prisma, submissionId, grade, feedback) => {
  // 1. Récupérer la soumission et les contraintes du devoir (barème)
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: parseInt(submissionId) },
    include: { assignment: true }
  });

  if (!submission) {
    const err = new Error("Soumission introuvable.");
    err.statusCode = 404; throw err;
  }

  const maxGrade = submission.assignment.maxGrade || 100;

  // 2. Mettre à jour la copie (statut GRADED et PENDING_PUSH)
  return prisma.assignmentSubmission.update({
    where: { id: submission.id },
    data: {
      grade: parseFloat(grade),
      feedback: feedback ? feedback.trim() : null,
      gradedAt: Math.floor(Date.now() / 1000),
      state: "GRADED",
      sync_status: "PENDING_PUSH" // Déclenchera le push vers Moodle
    }
  });
};