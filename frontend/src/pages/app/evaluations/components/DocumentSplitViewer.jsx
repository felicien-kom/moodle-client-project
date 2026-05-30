import { X, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

function canEmbedInline(mimeType = "", filename = "") {
  const lower = filename.toLowerCase();
  if (mimeType.includes("pdf") || lower.endsWith(".pdf")) return true;
  if (mimeType.startsWith("image/")) return true;
  return false;
}

export function DocumentSplitViewer({ preview, onClose, children }) {
  if (!preview) {
    return children;
  }

  const embeddable = canEmbedInline(preview.mimeType, preview.filename);

  return (
    <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-8rem)] animate-in fade-in duration-300">
      <div className="lg:w-1/2 overflow-y-auto lg:border-r border-slate-200 lg:pr-6 pb-6 lg:pb-0">
        {children}
      </div>

      <div className="lg:w-1/2 flex flex-col bg-slate-900 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] animate-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm font-medium text-white truncate">{preview.filename}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {preview.url && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-slate-300 hover:text-white hover:bg-slate-700"
                onClick={() => window.open(preview.url, "_blank")}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Ouvrir
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700"
              onClick={onClose}
              aria-label="Fermer l'aperçu"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-[320px] lg:min-h-0 bg-slate-950">
          {embeddable ? (
            preview.mimeType?.startsWith("image/") ? (
              <img
                src={preview.url}
                alt={preview.filename}
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <iframe
                src={preview.url}
                title={preview.filename}
                className="w-full h-full border-0"
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <FileText className="w-12 h-12 text-slate-500 mb-4" />
              <p className="text-slate-300 font-medium mb-2">Aperçu non disponible pour ce format</p>
              <p className="text-slate-500 text-sm mb-4">{preview.filename}</p>
              <Button
                variant="secondary"
                onClick={() => window.open(preview.url, "_blank")}
              >
                Télécharger / ouvrir le fichier
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
