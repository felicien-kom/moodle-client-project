import fs from 'fs';
const path = './src/pages/app/evaluations/components/AssignmentDetailsStudent.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add word count and validation limits
const validateCode = `
  const allowsText = assignment.allowedTypes === 'text' || assignment.allowedTypes === 'both' || !assignment.allowedTypes;
  const allowsFiles = assignment.allowedTypes === 'file' || assignment.allowedTypes === 'both' || !assignment.allowedTypes;

  // -- Validations --
  const wordCount = textResponse.trim() ? textResponse.trim().split(/\\s+/).length : 0;
  const isWordLimitExceeded = assignment.requiresText && assignment.wordLimit && wordCount > assignment.wordLimit;
  
  const isMaxFilesExceeded = assignment.maxFiles && selectedFiles.length > assignment.maxFiles;
  const isMaxFileSizeExceeded = assignment.maxFileSize && selectedFiles.some(f => f.size > assignment.maxFileSize);
  const isInvalid = Boolean(isWordLimitExceeded || isMaxFilesExceeded || isMaxFileSizeExceeded);
`;

content = content.replace(
  /const allowsText = .*?;\s*const allowsFiles = .*?;/,
  validateCode
);

// 2. Prevent HTTP calls safely
content = content.replace(/const handleSaveDraft = async \(\) => {/, 'const handleSaveDraft = async () => {\n    if (isInvalid) return;');
content = content.replace(/const handleSubmitFinal = async \(\) => {/, 'const handleSubmitFinal = async () => {\n    if (isInvalid) return;');

// 3. Show warnings in UI
const oldText = /\{allowsText && \([\s\S]*?<\/[dD]iv>\s*\)\s*}/;
const textWarning = `{allowsText && (
                <div className="mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Texte en ligne</label>
                    {assignment.requiresText && assignment.wordLimit && (
                      <span className={\`text-xs font-bold \${isWordLimitExceeded ? 'text-red-500' : 'text-slate-400'}\`}>
                        {wordCount} / {assignment.wordLimit} mots
                      </span>
                    )}
                  </div>
                  <Textarea
                    placeholder="Saisissez votre réponse ici..."
                    className={\`min-h-[150px] resize-y rounded-xl focus:ring-blue-500 \${isWordLimitExceeded ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}\`}
                    value={textResponse}
                    onChange={(e) => setTextResponse(e.target.value)}
                  />
                  {isWordLimitExceeded && (
                    <p className="text-xs text-red-500 font-medium mt-1">Vous avez dépassé la limite de mots autorisée.</p>
                  )}
                </div>
              )}`;
content = content.replace(oldText, textWarning);

// 4. File limits warnings
const fileWarningsRegex = /<p className="text-xs text-slate-500 mt-2">.*?(?=<\/div>\s*<\/div>\s*\{selectedFiles.length > 0 &&)/s;
const newFileWarnings = `<p className="text-xs text-slate-500 mt-2">
                        PDF, DOC, ZIP 
                        {assignment.maxFileSize ? \` (Max \${Math.round(assignment.maxFileSize / 1024 / 1024)}MB/fichier)\` : ''}
                        {assignment.maxFiles ? \` • Jusqu'à \${assignment.maxFiles} fichiers\` : ''}
                      </p>
                    </div>
                  </div>
                  {isMaxFilesExceeded && (
                    <p className="text-xs text-red-500 font-medium mt-2">Vous avez sélectionné trop de fichiers (Max {assignment.maxFiles}).</p>
                  )}
                  {isMaxFileSizeExceeded && (
                    <p className="text-xs text-red-500 font-medium mt-2">Certains fichiers dépassent la taille maximale autorisée.</p>
                  )}`;
content = content.replace(fileWarningsRegex, newFileWarnings);

// 5. Disable buttons
const buttonsRegex = /<Button\s+onClick={handleSaveDraft}\s+disabled={isSubmitting}/;
content = content.replace(buttonsRegex, '<Button\n                  onClick={handleSaveDraft}\n                  disabled={isSubmitting || isInvalid}');

const submitButtonRegex = /<Button\s+onClick={handleSubmitFinal}\s+disabled={isSubmitting}/;
content = content.replace(submitButtonRegex, '<Button\n                  onClick={handleSubmitFinal}\n                  disabled={isSubmitting || isInvalid}');

fs.writeFileSync(path, content, 'utf8');
console.log('AssignmentDetailsStudent UI modified');
