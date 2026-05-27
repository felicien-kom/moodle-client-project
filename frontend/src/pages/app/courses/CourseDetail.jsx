import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Folder,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import apiClient from "@/client/apiClient";
import { formatSectionsForUI } from "@/services/courses.service.js";
import { downloadFile, serveFile } from "@/services/files.service.js";
import { getFileIcon } from "@/utils/file.utils.js";
import FolderView from "./FolderView.jsx";

// ─── Icône colorée selon le type de ressource ─────────────────────────────────
function ContentIcon({ type }) {
  if (type === "file") {
    const dummyIcon = getFileIcon("file.txt");
    const IconComponent = dummyIcon.icon;
    return (
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100 ${dummyIcon.color}`}>
        <IconComponent className="w-3.5 h-3.5" />
      </div>
    );
  }

  const config = {
    folder:  { icon: Folder,         bg: "bg-amber-100",   text: "text-amber-600" },
    link:    { icon: ExternalLink,   bg: "bg-purple-100",  text: "text-purple-600" },
    assign:  { icon: ClipboardList,  bg: "bg-emerald-100", text: "text-emerald-600" },
  };
  
  const { icon: Icon, bg, text } = config[type] ?? { icon: Folder, bg: "bg-gray-100", text: "text-gray-600" };
  
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg} ${text}`}>
      <Icon className="w-3.5 h-3.5" />
    </div>
  );
}

// ─── Élément de contenu avec boutons appropriés ────────────────────────────────
function ContentItem({ item, onFolderClick, onFileDownload, onFileOpen, downloadedFiles = new Set() }) {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleFileAction = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      // Utiliser le fileId pour télécharger/ouvrir le fichier
      const fileId = item.fileData?.id || item.resourceId;
      console.log("Action fichier:", item, "fileId:", fileId);
      
      if (!fileId) {
        console.error("ID du fichier manquant:", item);
        alert("ID du fichier manquant");
        return;
      }
      
      const isDownloaded = downloadedFiles.has(fileId);
      
      if (isDownloaded) {
        // Ouvrir le fichier
        await onFileOpen(fileId);
      } else {
        // Télécharger le fichier
        await onFileDownload(fileId);
      }
    } catch (error) {
      console.error("Erreur lors de l'action fichier:", error);
      alert(`Erreur: ${error.message || error}`);
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
    <div className="flex items-center justify-between py-3 px-3 hover:bg-gray-50 transition-colors rounded-lg group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <ContentIcon type={item.type} />
        <div className="min-w-0 flex-1">
          {item.type === "link" ? (
            <button
              onClick={handleLinkClick}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors text-left"
            >
              <span className="group-hover:underline">{item.nom}</span>
              <ExternalLink className="w-3 h-3 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ) : (
            <p className="text-sm font-medium text-gray-700">
              {item.nom}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
        </div>
      </div>
      
      {/* Boutons d'action */}
      <div className="ml-3 flex-shrink-0">
        {item.type === "file" && (
          <Button
            onClick={handleFileAction}
            size="sm"
            variant={isFileDownloadedState ? "outline" : "default"}
            disabled={isDownloading}
            className="text-xs"
          >
            {isFileDownloadedState ? (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Ouvrir
              </>
            ) : (
              <>
                <Download className="w-3 h-3 mr-1" />
                Télécharger
              </>
            )}
          </Button>
        )}
        
        {item.type === "folder" && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onFolderClick(item);
            }}
            size="sm"
            className="text-xs"
          >
            <Folder className="w-3 h-3 mr-1" />
            Ouvrir
          </Button>
        )}
        
        {item.type === "assign" && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Naviguer vers le détail du devoir
              console.log("Devoir:", item);
            }}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            Voir
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Section dépliable ────────────────────────────────────────────────────────
function CourseSection({ section, onFolderClick, onFileDownload, onFileOpen, downloadedFiles = new Set() }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-gray-200 shadow-none rounded-xl overflow-hidden">
      {/* En-tête cliquable */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4
          hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <Layers className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-[15px] font-bold text-gray-900">{section.titre}</span>
        </div>
        {open
          ? <ChevronUp   className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {/* Corps */}
      {open && (
        <div className="px-6 pb-4 pt-0 border-t border-gray-100">
          <div className="flex flex-col divide-y divide-gray-100">
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
        </div>
      )}
    </div>
  );
}

// ─── Élément de navigation latérale ──────────────────────────────────────────
function NavItem({ label, active, onClick, isDetails }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
        transition-all text-left
        ${active
          ? "bg-indigo-50 text-indigo-700"
          : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
        }`}
    >
      {isDetails
        ? <Info    className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-indigo-600" : "text-gray-400"}`} />
        : <Layers  className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-indigo-600" : "text-gray-400"}`} />
      }
      {label}
    </button>
  );
}

// ─── VUE : Détail d'un cours ──────────────────────────────────────────────────
export default function CourseDetail({ cours = defaultCours, onRetour }) {
  const [activeNav, setActiveNav] = useState("details");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coursData, setCoursData] = useState(cours);
  const [sections, setSections] = useState([]);
  const [files, setFiles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [events, setEvents] = useState([]);
  const [downloadedFiles, setDownloadedFiles] = useState(() => {
    // Charger les fichiers téléchargés depuis localStorage
    const stored = localStorage.getItem('downloadedFiles');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [selectedFolder, setSelectedFolder] = useState(null);

  // Refs pour le scroll vers chaque section
  const detailsRef = useRef(null);
  const sectionRefs = useRef({});

  // ─── Gestion du téléchargement des fichiers ─────────────────────────────────
  const handleFileDownload = async (fileId) => {
    try {
      console.log("Téléchargement du fichier:", fileId);
      await downloadFile(fileId);
      setDownloadedFiles(prev => new Set([...prev, fileId]));
      console.log("Fichier téléchargé avec succès:", fileId);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      throw error;
    }
  };

  const handleFileOpen = async (fileId) => {
    try {
      console.log("Ouverture du fichier:", fileId);
      const blobUrl = await serveFile(fileId);
      window.open(blobUrl, '_blank');
      
      // Nettoyer l'URL blob après un court délai
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de l'ouverture:", error);
      throw error;
    }
  };

  const handleFolderClick = (folderItem) => {
    setSelectedFolder(folderItem);
  };

  const handleFolderBack = () => {
    setSelectedFolder(null);
  };

  // ─── Charger les données du backend au montage ─────────────────────────────
  useEffect(() => {
    loadCourseData();
  }, [cours?.id]);

  // ─── Sauvegarder les fichiers téléchargés dans localStorage ────────────────
  useEffect(() => {
    localStorage.setItem('downloadedFiles', JSON.stringify([...downloadedFiles]));
  }, [downloadedFiles]);

  async function loadCourseData() {
    try {
      setLoading(true);
      setError(null);

      if (!cours?.id) {
        setLoading(false);
        return;
      }

      // 🔵 Appel 1: Détails du cours
      const courseResponse = await apiClient.get(`/courses/${cours.id}`);
      setCoursData(courseResponse.course || cours);

      // 🟢 Appel 2: Sections du cours (Super-Endpoint avec modules imbriqués)
      try {
        const sectionsResponse = await apiClient.get(`/courses/${cours.id}/sections`);
        const backendSections = sectionsResponse.sections || [];
        // Transformer les sections en structure pour l'interface
        const transformedSections = formatSectionsForUI(backendSections);
        setSections(transformedSections);
      } catch (sectionsError) {
        console.error("Erreur lors du chargement des sections:", sectionsError);
        setSections([]);
      }

      // 🟡 Appel 3: Fichiers du cours
      try {
        const filesResponse = await apiClient.get(`/courses/${cours.id}/files`);
        setFiles(filesResponse.files || []);
      } catch (filesError) {
        console.error("Erreur lors du chargement des fichiers:", filesError);
        setFiles([]);
      }

      // 🟣 Appel 4: Assignments
      try {
        const assignResponse = await apiClient.get(`/courses/${cours.id}/assignments`);
        setAssignments(assignResponse.assignments || []);
      } catch (assignmentsError) {
        console.error("Erreur lors du chargement des devoirs:", assignmentsError);
        setAssignments([]);
      }

      // 🟠 Appel 5: Grades
      try {
        const gradesResponse = await apiClient.get(`/courses/${cours.id}/grades`);
        setGrades(gradesResponse.grades || []);
      } catch (gradesError) {
        console.error("Erreur lors du chargement des notes:", gradesError);
        setGrades([]);
      }

      // ⚫ Appel 6: Events
      try {
        const eventsResponse = await apiClient.get(`/courses/${cours.id}/events`);
        setEvents(eventsResponse.events || []);
      } catch (eventsError) {
        console.error("Erreur lors du chargement des événements:", eventsError);
        setEvents([]);
      }

    } catch (err) {
      // Erreur critique (ex: détails du cours)
      setError(err.message || "Erreur lors du chargement des détails du cours");
      console.error("Erreur chargement détails cours:", err);
    } finally {
      setLoading(false);
    }
  }

  function scrollTo(id) {
    setActiveNav(id);
    const ref = id === "details" ? detailsRef : sectionRefs.current[id];
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ─── État de chargement ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du cours...</p>
        </div>
      </div>
    );
  }

  // ─── État d'erreur ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-md">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <Button
            onClick={() => loadCourseData()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // ─── Afficher la vue dossier si un dossier est sélectionné ─────────────────
  if (selectedFolder) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Header avec nom du cours et bouton retour */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setSelectedFolder(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <h1 className="text-xl font-bold text-gray-900">{coursData.title || cours.title}</h1>
              <div className="w-20"></div>
            </div>
          </div>
        </div>

        {/* Barre d'onglets */}
        <Tabs defaultValue="cours" className="w-full max-w-5xl mx-auto">
          <div className="px-8 pt-6">
            <TabsList className="w-full justify-start bg-gray-200/50">
              <TabsTrigger value="cours" className="flex-1">Contenu</TabsTrigger>
              <TabsTrigger value="participants" className="flex-1">Participants</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="cours">
            <div className="px-8 py-6">
              <FolderView
                folder={selectedFolder}
                onRetour={() => setSelectedFolder(null)}
                downloadedFiles={downloadedFiles}
              />
            </div>
          </TabsContent>
          <TabsContent value="participants">Participants</TabsContent>
          <TabsContent value="notes">Notes</TabsContent>
        </Tabs>
      </div>
    );
  }

  // Utiliser les sections du backend
  const displaySections = sections;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header avec nom du cours et bouton retour */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onRetour}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'espace cours
            </Button>
            <h1 className="text-xl font-bold text-gray-900">{coursData.title || cours.title}</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Barre d'onglets */}
      <Tabs defaultValue="cours" className="w-full max-w-5xl mx-auto">
        <div className="px-8 pt-6">
          <TabsList className="w-full justify-start bg-gray-200/50">
            <TabsTrigger value="cours" className="flex-1">Contenu</TabsTrigger>
            <TabsTrigger value="participants" className="flex-1">Participants</TabsTrigger>
            <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="cours">
          {/* ── Layout principal : sidebar + contenu ── */}
          <div className="flex-1 px-8 py-6 flex gap-6">
            
            {/* Sidebar navigation */}
            <aside className="w-52 flex-shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">
                Navigation
              </p>
              <nav className="flex flex-col gap-0.5">
                <NavItem
                  label="Détails"
                  active={activeNav === "details"}
                  onClick={() => scrollTo("details")}
                  isDetails
                />
                {displaySections.map((s) => (
                  <NavItem
                    key={s.id}
                    label={s.titre.split("—")[0].trim()}
                    active={activeNav === s.id}
                    onClick={() => scrollTo(s.id)}
                  />
                ))}
              </nav>
            </aside>

            {/* Contenu principal */}
            <main className="flex-1 min-w-0 flex flex-col gap-4">

              {/* ── Carte Détails du cours ── */}
              <Card
                ref={detailsRef}
                className="border border-gray-200 shadow-none rounded-xl"
              >
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-5">Détails du cours</h2>

                  {/* Grille 2 colonnes */}
                  <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Nom court</p>
                      <p className="text-[15px] font-semibold text-gray-900">
                        {coursData.shortName ?? coursData.title?.slice(0, 8)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Sections</p>
                      <p className="text-[15px] font-semibold text-gray-900">
                        {displaySections.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Début</p>
                      <p className="text-[15px] font-semibold text-gray-900">
                        {coursData.startDate ? new Date(coursData.startDate * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : "Non définie"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Fin</p>
                      <p className="text-[15px] font-semibold text-gray-900">
                        {coursData.endDate ? new Date(coursData.endDate * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : "Non définie"}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-5" />

                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">Description</p>
                    <p className="text-sm text-gray-500 italic leading-relaxed">
                      {coursData.summary ?? "Aucune description disponible."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* ── Sections dépliables ── */}
              {displaySections.length > 0 ? (
                displaySections.map((section) => {
                  const ref = (el) => {
                    if (el && !sectionRefs.current[section.id]) {
                      sectionRefs.current[section.id] = { current: el };
                    }
                  };
                  return (
                    <Card
                      key={section.id}
                      ref={ref}
                      className="border border-gray-200 shadow-none rounded-xl overflow-hidden"
                    >
                      <CourseSection
                        section={section}
                        onFolderClick={setSelectedFolder}
                        onFileDownload={handleFileDownload}
                        onFileOpen={handleFileOpen}
                        downloadedFiles={downloadedFiles}
                      />
                    </Card>
                  );
                })
              ) : (
                <Card className="border border-gray-200 shadow-none rounded-xl">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-gray-500">
                      Le contenu du cours n'est pas disponible pour le moment.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Veuillez synchroniser le cours ou contacter l'administrateur.
                    </p>
                  </CardContent>
                </Card>
              )}

            </main>
          </div>
        </TabsContent>
        <TabsContent value="participants">Change your password here.</TabsContent>
        <TabsContent value="notes">Change your password here.</TabsContent>
      </Tabs>

    </div>
  );
}

// ─── Valeur par défaut si cours non fourni (alignée sur schema.prisma) ────────
const defaultCours = {
  title:       "Machine Learning",
  shortName:   "ML",
  categoryName: "Catégorie 1",
  summary:     "Cours complet de Machine Learning couvrant les fondamentaux, les algorithmes classiques et les réseaux de neurones.",
  startDate:   1737081600, // 16/01/2026
  endDate:     null,
  visible:     true,
};