export const validateGrade = (grade, feedback, maxGrade) => {
  const errors = [];
  const parsedGrade = parseFloat(grade);

  if (grade === undefined || Number.isNaN(parsedGrade)) {
    errors.push("La note doit être un nombre valide.");
  } else if (parsedGrade < 0 || parsedGrade > (maxGrade || 100)) {
    errors.push(`La note (${parsedGrade}) doit être comprise entre 0 et la note maximale (${maxGrade || 100}).`);
  }

  if (feedback && typeof feedback !== "string") {
    errors.push("Le commentaire (feedback) doit être du texte.");
  }

  return { errors, parsedGrade };
};