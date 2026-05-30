// src/controllers/assignment.controller.js
import * as assignService from "../services/assignment.service.js";
import { validateSaveDraft, validateSubmitAssignment } from "../validators/assignment.validator.js";

// PUT /api/assignments/:id/draft
export const saveDraft = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body; 
  const files = req.files;   // Géré en amont par le middleware Multer
  const moodleUserId = req.moodleUserId;

  // 1. Validation des entrées
  const { errors, parsedId: localAssignId } = validateSaveDraft({ id, text });
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  // 2. Exécution du service métier
  const submission = await assignService.saveLocalDraft(
    req.prisma, 
    req.user.email, 
    localAssignId, 
    text, 
    files,
    moodleUserId
  );
  
  res.json({ message: "Draft saved locally. Ready for sync.", submission });
};

// POST /api/assignments/:id/submit
export const submitAssignment = async (req, res) => {
  const { id } = req.params;

  // 1. Validation des entrées
  const { errors, parsedId: localAssignId } = validateSubmitAssignment({ id });
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  // 2. Exécution du service métier
  const submission = await assignService.submitAssignmentLocally(req.prisma, localAssignId);
  
  res.json({ message: "Assignment locked and submitted locally. Ready for sync.", submission });
};