import fs from 'fs';
const path = './src/pages/app/evaluations/components/AssignmentDetailsStudent.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Definition block
const definitionRegex = /const allowsText = .*?;\s*const allowsFiles = .*?;/;
const newDefinition = `const allowsText = assignment.allowedTypes === 'text' || assignment.allowedTypes === 'both' || !assignment.allowedTypes;
  const allowsFiles = assignment.allowedTypes === 'file' || assignment.allowedTypes === 'both' || !assignment.allowedTypes;

  // -- Validations --
  const wordCount = textResponse.trim() ? textResponse.trim().split(/\\s+/).length : 0;
  const isWordLimitExceeded = Boolean(assignment.requiresText && assignment.wordLimit && wordCount > assignment.wordLimit);
  
  const isMaxFilesExceeded = Boolean(assignment.maxFiles && selectedFiles.length > assignment.maxFiles);
  const isMaxFileSizeExceeded = Boolean(assignment.maxFileSize && selectedFiles.some(f => f.size > assignment.maxFileSize));
  const isInvalid = isWordLimitExceeded || isMaxFilesExceeded || isMaxFileSizeExceeded;`;

content = content.replace(definitionRegex, newDefinition);

// 2. Handlers
content = content.replace(
  'const handleSaveDraft = async () => {\n    try {',
  'const handleSaveDraft = async () => {\n    if (isInvalid) return;\n    try {'
);

content = content.replace(
  'const handleSubmitFinal = async () => {\n    if (!confirm(',
  'const handleSubmitFinal = async () => {\n    if (isInvalid) return;\n    if (!confirm('
);

// 3. UI Modifications for textarea
const oldTextUI = `{allowsText && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Texte en ligne</label>
                  <Textarea
                    placeholder="Saisissez votre réponse ici..."
                    className="min-h-[150px] resize-y rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    value={textResponse}
                    onChange={(e) => setTextResponse(e.target.value)}
                  />
                </div>
              )}`;

const newTextUI = `{allowsText && (
                <div className="mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Texte en ligne</label>
                    {assignment.requiresText && assignment.wordLimit ? (
                      <span className={\`text-xs font-bold \${isWordLimitExceeded ? 'text-red-500' : 'text-slate-400'}\`}>
                        {wordCount} / {assignment.wordLimit} mots
                      </span>
                    ) : null}
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

content = content.replace(oldTextUI, newTextUI);

// 4. File UI warnings
const oldFileUI = `<div className="text-center">
                      <UploadCloud className="mx-auto h-10 w-10 text-blue-500" aria-hidden="true" />
                      <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                        <label className="relative cursor-pointer rounded-md font-semibold text-blue-600 focus-within:outline-none hover:text-blue-500">
                          <span>Sélectionner des fichiers</span>
                          <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={handleFileSelect} />
                        </label>
                        <p className="pl-1">ou glissez-déposez</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">PDF, DOC, ZIP (Max {assignment.maxFileSize ? Math.round(assignment.maxFileSize / 1024 / 1024) : 10}MB)</p>
                    </div>`;

const newFileUI = `<div className="text-center">
                      <UploadCloud className="mx-auto h-10 w-10 text-blue-500" aria-hidden="true" />
                      <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                        <label className="relative cursor-pointer rounded-md font-semibold text-blue-600 focus-within:outline-none hover:text-blue-500">
                          <span>Sélectionner des fichiers</span>
                          <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={handleFileSelect} />
                        </label>
                        <p className="pl-1">ou glissez-déposez</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
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

content = content.replace(oldFileUI, newFileUI);

// Remove the first closing div that was shifted inside oldFileUI replacement to balance JSX
content = content.replace('</div>\n\n                  {selectedFiles.length > 0 && (', '{selectedFiles.length > 0 && (');


// 5. Disable buttons
content = content.replace(
  '<Button\n                  onClick={handleSaveDraft}\n                  disabled={isSubmitting}',
  '<Button\n                  onClick={handleSaveDraft}\n                  disabled={isSubmitting || isInvalid}'
);
content = content.replace(
  '<Button\n                  onClick={handleSubmitFinal}\n                  disabled={isSubmitting}',
  '<Button\n                  onClick={handleSubmitFinal}\n                  disabled={isSubmitting || isInvalid}'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Update assignment script done');
