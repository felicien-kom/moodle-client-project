import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  Video,
  Image,
  FileArchive,
  File,
  Download,
  Eye,
  CheckCircle2,
  RefreshCw,
  FolderLock,
  CloudDownload,
  Loader2,
  Info,
  Server,
  CloudOff,
  Cloud,
} from "lucide-react";
import { getAllLocalFiles, downloadFile, serveFile } from "@/services/files.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Helper for formatting file size
function formatBytes(bytes, decimals = 2) {
  if (!bytes) return "0 Octet";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Octets", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Function to get icon and color config according to file extension/mimetype
function getFileTypeConfig(filename, mimeType) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";
  const mime = mimeType?.toLowerCase() || "";

  if (ext === "pdf" || mime.includes("pdf")) {
    return { icon: FileText, bg: "bg-red-50 text-red-600 border-red-100", label: "PDF" };
  }
  if (["doc", "docx", "txt", "rtf", "odt"].includes(ext) || mime.includes("text") || mime.includes("word")) {
    return { icon: FileText, bg: "bg-blue-50 text-blue-600 border-blue-100", label: "Document" };
  }
  if (["xls", "xlsx", "csv", "ods"].includes(ext) || mime.includes("excel") || mime.includes("spreadsheet")) {
    return { icon: FileText, bg: "bg-emerald-50 text-emerald-600 border-emerald-100", label: "Tableur" };
  }
  if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext) || mime.includes("image")) {
    return { icon: Image, bg: "bg-purple-50 text-purple-600 border-purple-100", label: "Image" };
  }
  if (["mp4", "mkv", "avi", "mov", "webm"].includes(ext) || mime.includes("video")) {
    return { icon: Video, bg: "bg-pink-50 text-pink-600 border-pink-100", label: "Vidéo" };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext) || mime.includes("zip") || mime.includes("archive")) {
    return { icon: FileArchive, bg: "bg-amber-50 text-amber-600 border-amber-100", label: "Archive" };
  }

  return { icon: File, bg: "bg-slate-50 text-slate-600 border-slate-100", label: "Fichier" };
}

export default function Mediatheque() {
  const { isOnline } = useAuth();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTypeFilter, setActiveTypeFilter] = useState("all");
  const [activeOfflineFilter, setActiveOfflineFilter] = useState("all");
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);

  // Sync set with localStorage
  const [downloadedFiles, setDownloadedFiles] = useState(() => {
    const stored = localStorage.getItem("downloadedFiles");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const loadFiles = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getAllLocalFiles();
      setFiles(data);
    } catch (error) {
      console.error("Erreur réceptacle médiathèque:", error);
      toast.error("Problème de chargement", {
        description: "Impossible d'afficher la liste de vos fichiers pour le moment.",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    localStorage.setItem("downloadedFiles", JSON.stringify([...downloadedFiles]));
  }, [downloadedFiles]);

  const handleDownload = async (fileId) => {
    if (!isOnline) {
      toast.error("Connexion Internet requise", {
        description: "Ce fichier n'est pas encore sur votre appareil. Connectez-vous à Internet pour le télécharger.",
      });
      return;
    }

    try {
      setDownloadingIds((prev) => new Set([...prev, fileId]));
      await downloadFile(fileId);
      setDownloadedFiles((prev) => new Set([...prev, fileId]));
      toast.success("Fichier prêt hors-ligne !");
      await loadFiles(true); // reload list silently
    } catch (error) {
      toast.error("Problème de téléchargement", {
        description: "Nous n'avons pas pu enregistrer ce fichier. Réessayez plus tard.",
      });
    } finally {
      setDownloadingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(fileId);
        return copy;
      });
    }
  };

  const handleOpen = async (fileId) => {
    try {
      const blobUrl = await serveFile(fileId);
      window.open(blobUrl, "_blank");
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (error) {
      toast.error("Impossible d'ouvrir le fichier", {
        description: "Le fichier semble indisponible ou endommagé.",
      });
    }
  };

  // Download all pending files
  const handleDownloadAll = async () => {
    const pending = files.filter((f) => !f.isDownloaded && !downloadedFiles.has(f.id));
    if (pending.length === 0) {
      toast.info("Tout est à jour", { description: "Tous vos fichiers sont déjà disponibles hors-ligne !" });
      return;
    }

    if (!isOnline) {
      toast.error("Connexion requise", {
        description: "Activez votre connexion réseau pour sauvegarder l'ensemble de vos ressources.",
      });
      return;
    }

    try {
      setBulkDownloading(true);
      toast.info(`Téléchargement de ${pending.length} fichier(s)...`);
      
      let successCount = 0;
      for (const file of pending) {
        try {
          await downloadFile(file.id);
          setDownloadedFiles((prev) => new Set([...prev, file.id]));
          successCount++;
        } catch (err) {
          console.warn(`Échec téléchargement : ${file.filename}`, err);
        }
      }

      toast.success("Mise en cache achevée", {
        description: `${successCount} sur ${pending.length} fichier(s) ont été téléchargés avec succès.`,
      });
      await loadFiles(true);
    } catch (error) {
      toast.error("Erreur lors de l'export sélectif");
    } finally {
      setBulkDownloading(false);
    }
  };

  // Stats calculation
  const totalFiles = files.length;
  const offlineFilesCount = files.filter((f) => f.isDownloaded || downloadedFiles.has(f.id)).length;
  const onlineOnlyCount = totalFiles - offlineFilesCount;

  // Filter application
  const filteredFiles = files.filter((file) => {
    // Search query
    const matchQuery = file.filename?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // File Type grouping
    let matchType = true;
    const ext = file.filename?.split(".").pop()?.toLowerCase() || "";
    if (activeTypeFilter === "docs") {
      matchType = ["pdf", "doc", "docx", "txt", "rtf", "odt", "xls", "xlsx", "csv"].includes(ext);
    } else if (activeTypeFilter === "images") {
      matchType = ["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext);
    } else if (activeTypeFilter === "videos") {
      matchType = ["mp4", "mkv", "avi", "mov", "webm"].includes(ext);
    } else if (activeTypeFilter === "archives") {
      matchType = ["zip", "rar", "7z", "tar", "gz"].includes(ext);
    }

    // Cache / Offline status filtering
    let matchOffline = true;
    const isCached = file.isDownloaded || downloadedFiles.has(file.id);
    if (activeOfflineFilter === "cached") {
      matchOffline = isCached;
    } else if (activeOfflineFilter === "pending") {
      matchOffline = !isCached;
    }

    return matchQuery && matchType && matchOffline;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Médiathèque globale
          </h1>
          <p className="mt-1 text-slate-500 font-medium">
            Consultez, gérez et téléchargez toutes vos ressources de cours et de devoirs pour y accéder partout.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => loadFiles()}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-slate-200 text-slate-700 h-10 px-4 rounded-xl"
            title="Actualiser la liste"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            onClick={handleDownloadAll}
            disabled={bulkDownloading || loading}
            size="sm"
            className="bg-primary hover:bg-primary/95 text-white h-10 px-4 rounded-xl font-bold gap-2 shadow-sm"
          >
            {bulkDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mise en cache...
              </>
            ) : (
              <>
                <CloudDownload className="w-4 h-4" />
                Tout rendre disponible hors-ligne
              </>
            )}
          </Button>
        </div>
      </div>

      {/* STATS DE LA MÉDIATHÈQUE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-200/60 rounded-3xl shadow-sm bg-white overflow-hidden p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fichiers indexés</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">{totalFiles}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Server className="w-6 h-6" />
          </div>
        </Card>

        <Card className="border border-slate-200/60 rounded-3xl shadow-sm bg-white overflow-hidden p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dispo hors-ligne</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-2">{offlineFilesCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="border border-slate-200/60 rounded-3xl shadow-sm bg-white overflow-hidden p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">En ligne seulement</p>
            <h3 className="text-3xl font-black text-slate-600 mt-2">{onlineOnlyCount}</h3>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
            <Cloud className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* RECHERCHE ET FILTRES */}
      <Card className="border border-slate-200/60 rounded-3xl shadow-sm bg-white p-5 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher par nom de fichier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border-slate-200 focus-visible:ring-primary focus-visible:ring-offset-0 rounded-xl"
            />
          </div>

          <div className="flex gap-2 shrink-0 overflow-x-auto pb-1 md:pb-0">
            {/* Cache filters */}
            <button
              onClick={() => setActiveOfflineFilter("all")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                activeOfflineFilter === "all"
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              Tous les statuts
            </button>
            <button
              onClick={() => setActiveOfflineFilter("cached")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                activeOfflineFilter === "cached"
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              Hors-ligne
            </button>
            <button
              onClick={() => setActiveOfflineFilter("pending")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                activeOfflineFilter === "pending"
                  ? "bg-amber-600 border-amber-600 text-white"
                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              En ligne
            </button>
          </div>
        </div>

        <Separator className="bg-slate-100" />

        {/* Type Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Extensions:</span>
          {[
            { id: "all", label: "Tous" },
            { id: "docs", label: "Documents" },
            { id: "images", label: "Images / Infographies" },
            { id: "videos", label: "Vidéos" },
            { id: "archives", label: "Archives ZIP" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveTypeFilter(type.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTypeFilter === type.id
                  ? "bg-primary/10 text-primary"
                  : "bg-transparent text-slate-600 hover:bg-slate-100"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </Card>

      {/* LISTE DES FICHIERS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-slate-500">Médiathèque en cours d'indexation...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card className="border border-dashed border-slate-300 rounded-3xl p-16 text-center shadow-none bg-slate-50/50">
          <CloudOff className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Aucun fichier trouvé</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">
            Aucun média ne correspond à vos critères ou les répertoires sont actuellement vides.
          </p>
        </Card>
      ) : (
        <Card className="border border-slate-200/60 rounded-3xl shadow-sm bg-white overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredFiles.map((file) => {
              const fileIdConfig = getFileTypeConfig(file.filename, file.mimeType);
              const IconComponent = fileIdConfig.icon;
              const isLocal = file.isDownloaded || downloadedFiles.has(file.id);
              const isCurrentDownloading = downloadingIds.has(file.id);

              return (
                <div
                  key={file.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50/50 transition-colors gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl border flex-shrink-0 ${fileIdConfig.bg}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold text-slate-800 truncate" title={file.filename}>
                        {file.filename}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-slate-400 font-semibold text-xs">{formatBytes(file.fileSize)}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                        <span className="text-slate-400 font-semibold text-xs">{fileIdConfig.label}</span>
                        {isLocal ? (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 font-bold border-none text-[10px] h-5 py-0 px-2 rounded-full">
                            Hors-ligne
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 font-bold border-none text-[10px] h-5 py-0 px-2 rounded-full">
                            En ligne uniquement
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    {isLocal ? (
                      <Button
                        onClick={() => handleOpen(file.id)}
                        size="sm"
                        variant="outline"
                        className="h-9 px-4 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-100 gap-1.5"
                      >
                        <Eye className="w-4 h-4 text-emerald-500" />
                        Ouvrir
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleDownload(file.id)}
                        disabled={isCurrentDownloading}
                        size="sm"
                        className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold gap-1.5"
                      >
                        {isCurrentDownloading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Mise en cache...
                          </>
                        ) : (
                          <>
                            <CloudDownload className="w-4 h-4" />
                            Télécharger
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
