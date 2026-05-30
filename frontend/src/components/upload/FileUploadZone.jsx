import { useId, useRef, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadError, uploadSuccess } from "@/utils/uploadToast";

/**
 * Zone d'upload réutilisable : glisser-déposer + clic, spinner pendant l'envoi.
 * - `onUpload` : envoi serveur avec toast chargement / succès / erreur
 * - `onFilesSelected` : sélection locale uniquement (sans toast par défaut)
 */
export function FileUploadZone({
  accept,
  multiple = false,
  disabled = false,
  maxFileSize,
  maxFiles,
  currentFileCount = 0,
  title = "Glissez vos fichiers ici ou cliquez pour parcourir",
  hint,
  className,
  onUpload,
  onFilesSelected,
  showSelectToast = false,
  children,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const validateFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return { error: null, files: [] };

    if (maxFiles != null && currentFileCount + files.length > maxFiles) {
      return { error: `Maximum ${maxFiles} fichier(s) autorisé(s).`, files: [] };
    }

    if (maxFileSize != null) {
      const tooBig = files.find((f) => f.size > maxFileSize);
      if (tooBig) {
        const mb = Math.round(maxFileSize / 1024 / 1024);
        return { error: `${tooBig.name} dépasse la taille maximale (${mb} Mo).`, files: [] };
      }
    }

    return { error: null, files };
  };

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const processFiles = async (fileList) => {
    if (disabled || isUploading) return;

    const { error, files } = validateFiles(fileList);
    if (error) {
      uploadError(error);
      resetInput();
      return;
    }
    if (!files.length) return;

    if (onUpload) {
      setIsUploading(true);
      try {
        await onUpload(files);
        uploadSuccess("Chargement terminé");
      } catch (err) {
        uploadError(err?.message || "Échec du chargement");
      } finally {
        setIsUploading(false);
        resetInput();
      }
      return;
    }

    if (onFilesSelected) {
      onFilesSelected(files);
      if (showSelectToast) {
        uploadSuccess(files.length > 1 ? "Fichiers sélectionnés" : "Fichier sélectionné");
      }
      resetInput();
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;
    processFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e) => {
    processFiles(e.target.files);
  };

  const isInteractive = !disabled && !isUploading;

  return (
    <div className={cn("relative", className)}>
      <label
        htmlFor={inputId}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative block rounded-xl border border-dashed transition-colors",
          children ? "p-0 overflow-hidden" : "px-6 py-8 text-center",
          isInteractive ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-60",
          isDragging
            ? "border-indigo-500 bg-indigo-50/60"
            : "border-slate-300"
        )}
      >
        {children ?? (
          <>
            <UploadCloud
              className={cn(
                "mx-auto h-8 w-8 mb-2",
                isDragging ? "text-indigo-600" : "text-indigo-500"
              )}
            />
            <p className="text-sm font-medium text-slate-600">{title}</p>
            {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
          </>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/85 backdrop-blur-[1px]">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
            <p className="text-xs font-medium text-slate-600">Chargement en cours…</p>
          </div>
        )}
      </label>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled || isUploading}
        className="sr-only"
        onChange={handleInputChange}
      />
    </div>
  );
}
