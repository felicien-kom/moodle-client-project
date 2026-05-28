import fs from 'fs';
const path = './src/pages/app/evaluations/components/AssignmentDetailsStudent.jsx';
let content = fs.readFileSync(path, 'utf8');

const regexStatus = /\{\s*isSubmitted\s*\?\s*\"Remis pour [\\s\\S]*?\"Aucune tentative\"\s*\}/m;

const newStatus = `{(() => {
                  const state = assignment.submission?.state;
                  const sync = assignment.submission?.sync_status;
                  
                  if (state === "SUBMITTED" || state === "GRADED") {
                    return sync === "PENDING_PUSH" ? "Finalisé (Prêt à envoyer)" : "Remis pour évaluation";
                  }
                  if (state === "DRAFT") {
                    return sync === "PENDING_PUSH" ? "Brouillon modifié (Non synchronisé)" : "Brouillon enregistré";
                  }
                  return "Aucune tentative";
                })()}`;

content = content.replace(regexStatus, newStatus);
fs.writeFileSync(path, content, 'utf8');
