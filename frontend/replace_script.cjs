const fs = require('fs');
const path = './src/pages/app/courses/CourseDetail.jsx';
let content = fs.readFileSync(path, 'utf8');

const regexMap = /\/\/ â”€â”€â”€ IcÃ´ne colorÃ©e selon le type de ressource â”€â”€â”€[\s\S]*?(?=\/\/ â”€â”€â”€ Ã‰lÃ©ment de navigation latÃ©rale â”€â”€â”€)/;

const newComponentCode = `// ▬▬▬ Icône colorée selon le type de ressource ▬▬▬
function ContentIcon({ type, isDownloaded }) {
  if (type === 'file') {
    if (isDownloaded) {
      return (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-100 text-emerald-600">
          <CheckCircle className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600">
        <FileText className="w-4 h-4" />
      </div>
    );
  }

  const config = {
    folder:  { icon: Folder,         bg: "bg-amber-100",   text: "text-amber-600" },
    link:    { icon: ExternalLink,   bg: "bg-purple-100",  text: "text-purple-600" },
    assign:  { icon: FileEdit,       bg: "bg-orange-100",  text: "text-orange-600" },
  };
  
  const { icon: Icon, bg, text } = config[type] ?? { icon: Folder, bg: "bg-slate-100", text: "text-slate-600" };
  
  return (
    <div className={\`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 \${bg} \${text}\`}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

// ▬▬▬ Élément de contenu avec boutons appropriés ▬▬▬
function ContentItem({ item, onFolderClick, onFileDownload, onFileOpen, downloadedFiles = new Set() }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { role } = useUserRole();
  const isTeacher = role === 'teacher';
  
  const handleFileAction = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      const fileId = item.fileData?.id || item.resourceId;
      if (!fileId) {
        alert("ID du fichier manquant");
        return;
      }
      
      if (downloadedFiles.has(fileId)) {
        await onFileOpen(fileId);
      } else {
        await onFileDownload(fileId);
      }
    } catch (error) {
      alert(\`Erreur: \${error.message || error}\`);
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleLinkClick = (e) => {
    if (item.url) {
      e.stopPropagation();
      window.open(item.url, "_blank");
    }
  };
  
  const fileId = item.fileData?.id || item.resourceId;
  const isFileDownloadedState = fileId ? downloadedFiles.has(fileId) : false;
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 hover:bg-slate-50 transition-colors rounded-lg group gap-3">
      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
        <ContentIcon type={item.type} isDownloaded={isFileDownloadedState && item.type === 'file'} />
        <div className="min-w-0 flex-1">
          {item.type === 'link' ? (
            <button
              onClick={handleLinkClick}
              className="text-[15px] font-semibold text-slate-800 hover:text-primary transition-colors text-left">
              <span className="group-hover:underline">{item.nom}</span>
              <ExternalLink className="w-3.5 h-3.5 inline ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ) : (
            <p className="text-[15px] font-semibold text-slate-800">
              {item.nom}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs font-medium text-slate-500">{item.detail}</p>
            {item.type === 'assign' && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-semibold bg-orange-100 text-orange-700 hover:bg-orange-100">
                À rendre
              </Badge>
            )}
            {item.type === 'file' && isFileDownloadedState && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                Disponible hors ligne
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-shrink-0 flex items-center justify-end">
        {item.type === 'file' && (
          <Button
            onClick={handleFileAction}
            size="sm"
            variant={isFileDownloadedState ? "outline" : "default"}
            disabled={isDownloading}
            className={\`text-xs shadow-sm h-8 \${isFileDownloadedState ? 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100' : 'bg-primary hover:bg-primary/90'}\`}
          >
            {isDownloading ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> En cours...</>
            ) : isFileDownloadedState ? (
              <><Eye className="w-3.5 h-3.5 mr-1.5" /> Ouvrir</>
            ) : (
              <><CloudDownload className="w-3.5 h-3.5 mr-1.5" /> Télécharger</>
            )}
          </Button>
        )}
        
        {item.type === 'folder' && (
          <Button onClick={(e) => { e.stopPropagation(); onFolderClick(item); }} size="sm" variant="outline" className="text-xs h-8 bg-white border-slate-200 text-slate-700">
            <Folder className="w-3.5 h-3.5 mr-1.5" /> Ouvrir
          </Button>
        )}
        
        {item.type === 'assign' && (
          <Button onClick={(e) => { e.stopPropagation(); window.location.href = "/app/assignment"; }} size="sm" className="text-xs h-8 bg-slate-900 text-white hover:bg-slate-800">
            {isTeacher ? "Soumissions" : "Ma remise"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ▬▬▬ Section dépliable ▬▬▬
function CourseSection({ section, onFolderClick, onFileDownload, onFileOpen, downloadedFiles = new Set() }) {
  return (
    <AccordionItem value={section.id.toString()} className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white data-[state=open]:rounded-b-none mb-4 last:mb-0">
      <AccordionTrigger className="px-6 py-4 hover:bg-slate-50/80 hover:no-underline transition-colors data-[state=open]:bg-primary/5 group">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary group-data-[state=open]:bg-white group-data-[state=open]:shadow-sm transition-all">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-base font-bold text-slate-900">{section.titre}</span>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="px-4 pb-4 pt-2 border-t border-slate-100 bg-white">
        <div className="flex flex-col divide-y divide-slate-100">
          {section.items.map((item, i) => (
            <ContentItem
              key={i}
              item={item}
              onFolderClick={onFolderClick}
              onFileDownload={onFileDownload}
              onFileOpen={onFileOpen}
              downloadedFiles={downloadedFiles}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

`;
content = content.replace(regexMap, newComponentCode);

const oldDomMap = /<div className="space-y-4">[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>\s*<\/TabsContent>)/;
const newDomCode = `<Accordion 
                  type="multiple" 
                  className="w-full" 
                  defaultValue={displaySections.map(s => s.id.toString())}
                >
                  {displaySections.map((section) => {
                    const ref = (el) => {
                      if (el && !sectionRefs.current[section.id]) {
                        sectionRefs.current[section.id] = { current: el };
                      }
                    };
                    return (
                      <div ref={ref} key={section.id}>
                        <CourseSection
                          section={section}
                          onFolderClick={setSelectedFolder}
                          onFileDownload={handleFileDownload}
                          onFileOpen={handleFileOpen}
                          downloadedFiles={downloadedFiles}
                        />
                      </div>
                    );
                  })}
                </Accordion>`;
content = content.replace(oldDomMap, newDomCode);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated CourseDetail.jsx');
