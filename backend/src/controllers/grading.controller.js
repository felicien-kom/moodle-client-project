import * as gradingService from "../services/grading.service.js";
import { validateGrade } from "../validators/grading.validator.js";

// PUT /api/v1/submissions/:id/grade
export const gradeSubmission = async (req, res) => {
  const { id } = req.params;
  const { grade, feedback } = req.body;

  // On récupère d'abord la limite maximale pour le validateur
  const submission = await req.prisma.assignmentSubmission.findUnique({
    where: { id: parseInt(id) },
    include: { assignment: true }
  });

  if (!submission) return res.status(404).json({ error: "Soumission introuvable" });

  const { errors, parsedGrade } = validateGrade(grade, feedback, submission.assignment.maxGrade);
  if (errors.length > 0) return res.status(400).json({ errors });

  const updatedSubmission = await gradingService.gradeSubmissionLocal(
    req.prisma, 
    id, 
    parsedGrade, 
    feedback
  );

  res.json({ message: "Note enregistrée localement (Prête pour synchronisation).", submission: updatedSubmission });
};