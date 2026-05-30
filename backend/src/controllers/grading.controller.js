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

// GET /api/v1/grading
export const getGrades = async (req, res) => {
  try {
    const localUser = await req.prisma.localUser.findUnique({ where: { email: req.user.email } });
    if (!localUser) return res.status(404).json({ error: "Utilisateur non trouvé" });

    let submissions;

    // Si l'utilisateur est étudiant, on ne lui renvoie que ses propres copies notées
    if (localUser.role === "STUDENT") {
      submissions = await req.prisma.assignmentSubmission.findMany({
        where: { 
          moodleUserId: localUser.moodleUserId,
          grade: { not: null }
        },
        include: {
          assignment: {
            include: { course: true }
          }
        }
      });
    } else {
      // Si c'est un enseignant ou admin, on renvoie toutes les copies notées
      submissions = await req.prisma.assignmentSubmission.findMany({
        where: {
          grade: { not: null }
        },
        include: {
          assignment: {
            include: { course: true }
          }
        }
      });
    }

    res.json({ grades: submissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};