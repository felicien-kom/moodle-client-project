import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  Eye,
} from "lucide-react";
import { getFileIcon, formatFileSize } from "@/utils/file.utils.js";
import { downloadFile, serveFile } from "@/services/files.service.js";

// ─── Élément de fichier ───────────────────────────────────────────────────
function FileItem({ file, onDownload, onOpen, isDownloaded }) {
  const filename = file.filename || file.name || "Fichier inconnu";
  const filesize = file.fileSize ? formatFileSize(file.fileSize) : "Taille inconnue";
  const { icon: IconComponent, color } = getFileIcon(filename);
  
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-5 h-5 flex-shrink-0 ${color}`}>
          <IconComponent className="w-full h-full" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800 truncate">
            {filename}
          </p>
          <p className="text-xs text-gray-500">{filesize}</p>
        </div>
      </div>
      
      <Button
        onClick={() => isDownloaded ? onOpen(file) : onDownload(file)}
        size="sm"
        variant={isDownloaded ? "outline" : "default"}
        className="ml-2 flex-shrink-0"
      >
        {isDownloaded ? (
          <>
            <Eye className="w-3.5 h-3.5 mr-1" />
            Ouvrir
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 mr-1" />
            Télécharger
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Vue principale des dossiers ──────────────────────────────────────────
export default function FolderView({ folder, onRetour, downloadedFiles = new Set() }) {
  const [isLoading, setIsLoading] = useState(false);
  const [localDownloadedFiles, setLocalDownloadedFiles] = useState(() => {
    // Charger les fichiers téléchargés depuis localStorage
    const stored = localStorage.getItem('downloadedFiles');
    const storedSet = stored ? new Set(JSON.parse(stored)) : new Set();
    return new Set([...downloadedFiles, ...storedSet]);
  });
  
  const files = folder.files || [];
  
  // Sauvegarder dans localStorage quand les fichiers téléchargés changent
  useEffect(() => {
    localStorage.setItem('downloadedFiles', JSON.stringify([...localDownloadedFiles]));
  }, [localDownloadedFiles]);
  
  const handleDownload = async (file) => {
    setIsLoading(true);
    try {
      // Utiliser le fileId pour télécharger le fichier
      // Essayer plusieurs sources possibles pour l'ID
      const fileId = file.id || file.fileId || file.fileData?.id;
      console.log("Tentative de téléchargement pour fichier:", file, "fileId:", fileId);
      
      if (!fileId) {
        console.error("ID du fichier manquant:", file);
        alert("ID du fichier manquant");
        return;
      }
      
      const result = await downloadFile(fileId);
      console.log("Résultat du téléchargement:", result);
      
      // Marquer le fichier comme téléchargé
      setLocalDownloadedFiles(prev => new Set([...prev, fileId]));
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      alert(`Erreur lors du téléchargement: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpen = async (file) => {
    try {
      // Utiliser le fileId pour servir le fichier
      const fileId = file.id || file.fileId || file.fileData?.id;
      console.log("Tentative d'ouverture pour fichier:", file, "fileId:", fileId);
      
      if (!fileId) {
        console.error("ID du fichier manquant:", file);
        alert("ID du fichier manquant");
        return;
      }
      
      const blobUrl = await serveFile(fileId);
      console.log("Blob URL du fichier:", blobUrl);
      
      // Ouvrir le fichier dans un nouvel onglet
      window.open(blobUrl, '_blank');
      
      // Nettoyer l'URL blob après un court délai
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de l'ouverture:", error);
      alert(`Erreur lors de l'ouverture: ${error.message || error}`);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onRetour}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
         Retour
        </button>
        
        <Card className="border border-gray-200 shadow-none rounded-xl">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              {folder.nom || "Dossier"}
            </h1>
            {folder.detail && (
              <p className="text-sm text-gray-600">
                {folder.detail}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {files.length} fichier{files.length > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Separator />
      
      {/* Liste des fichiers */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Fichiers
        </h2>
        
        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file, index) => {
              const fileId = file.id || file.fileId || file.fileData?.id;
              return (
                <FileItem
                  key={index}
                  file={file}
                  onDownload={handleDownload}
                  onOpen={handleOpen}
                  isDownloaded={localDownloadedFiles.has(fileId)}
                />
              );
            })}
          </div>
        ) : (
          <Card className="border border-gray-200 shadow-none rounded-xl">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-500">
                Ce dossier ne contient aucun fichier.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
