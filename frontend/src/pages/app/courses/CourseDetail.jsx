import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  UserPlus,
  Plus,
  MoreVertical,
  CheckCircle,
  FileText,
  FileEdit,
  Loader2,
  CloudDownload,
} from "lucide-react";
import apiClient from "@/client/apiClient";
import { formatSectionsForUI, enrollCourseOnline, createSection, getParticipantsByCourse } from "@/services/courses.service.js";
import { downloadFile, serveFile } from "@/services/files.service.js";
import { getFileIcon } from "@/utils/file.utils.js";
import FolderView from "./FolderView.jsx";
import RessourcesActicityModal from "@/components/courses/RessourcesActicityModal.jsx";
import { useUserRole } from "@/hooks/useUserRole";
import { userRole } from "@/services/user.service";

// ─── Icône colorée selon le type de resso// ??? Ic�ne color�e selon le type de ressource ???
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
    folder: { icon: Folder, bg: "bg-amber-100", text: "text-amber-600" },
    link: { icon: ExternalLink, bg: "bg-purple-100", text: "text-purple-600" },
    assign: { icon: FileEdit, bg: "bg-orange-100", text: "text-orange-600" },
  };

  const { icon: Icon, bg, text } = config[type] ?? { icon: Folder, bg: "bg-slate-100", text: "text-slate-600" };

  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg} ${text}`}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

// ??? �l�ment de contenu avec boutons appropri�s ???
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 hover:bg-slate-50 transition-colors rounded-lg group gap-3">
      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
        <ContentIcon type={item.type} isDownloaded={isFileDownloadedState && item.type === 'file'} />
        <div className="min-w-0 flex-1">
          {item.type === 'link' ? (
            <button
              onClick={handleLinkClick}
              className="text-[15px] font-semibold text-slate-800 hover:text-primary transition-colors text-left font-sans">
              <span className="group-hover:underline">{item.nom}</span>
              <ExternalLink className="w-3.5 h-3.5 inline ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ) : (
            <p className="text-[15px] font-semibold text-slate-800 font-sans">
              {item.nom}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs font-medium text-slate-500">{item.detail}</p>
            {item.type === 'assign' && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-semibold bg-orange-100 text-orange-700 hover:bg-orange-100">
                � rendre
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
            className={`text-xs shadow-sm h-8 ${isFileDownloadedState ? 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100' : 'bg-primary hover:bg-primary/95'}`}
          >
            {isDownloading ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> En cours...</>
            ) : isFileDownloadedState ? (
              <><Eye className="w-3.5 h-3.5 mr-1.5" /> Ouvrir</>
            ) : (
              <><CloudDownload className="w-3.5 h-3.5 mr-1.5" /> T�l�charger</>
            )}
          </Button>
        )}

        {item.type === 'folder' && (
          <Button onClick={(e) => { e.stopPropagation(); onFolderClick(item); }} size="sm" variant="outline" className="text-xs h-8 bg-white border-slate-200 text-slate-700">
            <Folder className="w-3.5 h-3.5 mr-1.5" /> Ouvrir
          </Button>
        )}

        {item.type === 'assign' && (
          <Button onClick={(e) => { e.stopPropagation(); console.log("Devoir:", item); }} size="sm" className="text-xs h-8 bg-slate-900 text-white hover:bg-slate-800">
            {isTeacher ? "Soumissions" : "Ma remise"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ??? Section dpliable ???
function CourseSection({ section, onFolderClick, onFileDownload, onFileOpen, downloadedFiles = new Set() }) {
  const [open, setOpen] = useState(true);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  return (
    <div className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white mb-4 last:mb-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary group-data-[state=open]:bg-white group-data-[state=open]:shadow-sm transition-all">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-base font-bold text-slate-900">{section.titre}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Menu déroulant pour ajouter un module */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button
                className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                title="Options"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsActivityModalOpen(true); }}>
                Ajouter un module
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {open
            ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
            : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        </div>
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

      {/* Modal d'ajout d'activité/ressource */}
      <RessourcesActicityModal
        open={isActivityModalOpen}
        onOpenChange={setIsActivityModalOpen}
      />
    </div>
  );
}


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
        ? <Info className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-indigo-600" : "text-gray-400"}`} />
        : <Layers className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-indigo-600" : "text-gray-400"}`} />
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
  const [participants, setParticipants] = useState([]);
  const [downloadedFiles, setDownloadedFiles] = useState(() => {
    // Charger les fichiers téléchargés depuis localStorage
    const stored = localStorage.getItem('downloadedFiles');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [isCreatingSection, setIsCreatingSection] = useState(false);

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

  // ─── Gestion de l'inscription au cours ─────────────────────────────────────
  const handleEnrollClick = () => {
    setIsEnrollModalOpen(true);
  };

  const handleEnrollConfirm = async () => {
    try {
      setIsEnrolling(true);
      const serverId = coursData.serverId || coursData.id;

      if (!serverId) {
        alert("ID du serveur non disponible");
        return;
      }

      await enrollCourseOnline(serverId);

      setIsEnrollModalOpen(false);
      setIsSuccessModalOpen(true);

      // Recharger les données pour mettre à jour l'état
      loadCourseData();
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      alert("Erreur lors de l'inscription: " + (error.message || error));
    } finally {
      setIsEnrolling(false);
    }
  };

  // ─── Gestion de la création de section ─────────────────────────────────────
  const handleAddSectionClick = () => {
    setIsSectionModalOpen(true);
    setNewSectionName("");
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      alert("Veuillez entrer un nom pour la section");
      return;
    }

    try {
      setIsCreatingSection(true);
      const courseId = coursData.id || coursData.serverId;

      if (!courseId) {
        alert("ID du cours non disponible");
        return;
      }

      await createSection(courseId, newSectionName.trim());

      setIsSectionModalOpen(false);
      setNewSectionName("");

      // Recharger les sections
      const sectionsResponse = await apiClient.get(`/courses/${courseId}/sections`);
      const backendSections = sectionsResponse.sections || [];
      const transformedSections = formatSectionsForUI(backendSections);
      setSections(transformedSections);
    } catch (error) {
      console.error("Erreur lors de la création de la section:", error);
      alert("Erreur lors de la création de la section: " + (error.message || error));
    } finally {
      setIsCreatingSection(false);
    }
  };

  const handleSectionNameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateSection();
    }
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

      // 🟤 Appel 7: Participants du cours (pour TEACHER)
      try {
        const role = userRole();
        if (role === "teacher") {
          const participantsData = await getParticipantsByCourse(cours.id);
          setParticipants(participantsData || []);
        }
      } catch (participantsError) {
        console.error("Erreur lors du chargement des participants:", participantsError);
        setParticipants([]);
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
          <TabsContent value="participants">
            {userRole() === "teacher" ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="text-base font-bold text-slate-900 mb-4">Membres du cours</h3>
                {participants.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {participants.map((p) => (
                      <li key={p.id} className="py-2.5 text-sm text-slate-700 font-sans font-medium">
                        {p.fullname}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 font-sans">Aucun participant inscrit.</p>
                )}
              </div>
            ) : (
              "Participants"
            )}
          </TabsContent>
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
            {/* Bouton d'inscription (uniquement pour les cours du catalogue/explorer) */}
            {coursData.serverId && (
              <Button
                onClick={handleEnrollClick}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                S'inscrire
              </Button>
            )}
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

              {/* ── Bouton Ajouter une section ── */}
              <Button
                onClick={handleAddSectionClick}
                className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base border-2 border-dashed border-indigo-300 rounded-xl flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Ajouter une section
              </Button>

            </main>
          </div>
        </TabsContent>
        <TabsContent value="participants">
          {userRole() === "teacher" ? (
            <Card className="border border-gray-200 shadow-none rounded-xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Liste des participants</h3>
                {participants.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {participants.map((participant) => (
                      <li key={participant.id} className="py-3 text-sm text-gray-700 font-medium font-sans">
                        {participant.fullname}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 font-sans">Aucun participant trouvé pour ce cours.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            "Change your password here."
          )}
        </TabsContent>
        <TabsContent value="notes">Change your password here.</TabsContent>
      </Tabs>

      {/* Modal de confirmation d'inscription */}
      <Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer inscription</DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment vous inscrire au cours "{coursData.title || cours.title}" ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEnrollModalOpen(false)}
              disabled={isEnrolling}
            >
              Annuler
            </Button>
            <Button
              onClick={handleEnrollConfirm}
              disabled={isEnrolling}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEnrolling ? "Inscription..." : "Confirmer inscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de succès d'inscription */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <DialogTitle className="text-center">Inscription réussie !</DialogTitle>
            <DialogDescription className="text-center">
              Vous êtes maintenant inscrit au cours "{coursData.title || cours.title}".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center">
            <Button
              onClick={() => setIsSuccessModalOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de création de section */}
      <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle section</DialogTitle>
            <DialogDescription>
              Entrez le nom de la nouvelle section pour le cours "{coursData.title || cours.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nom de la section..."
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={handleSectionNameKeyDown}
              autoFocus
              disabled={isCreatingSection}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSectionModalOpen(false)}
              disabled={isCreatingSection}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateSection}
              disabled={isCreatingSection || !newSectionName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isCreatingSection ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ─── Valeur par défaut si cours non fourni (alignée sur schema.prisma) ────────
const defaultCours = {
  title: "Machine Learning",
  shortName: "ML",
  categoryName: "Catégorie 1",
  summary: "Cours complet de Machine Learning couvrant les fondamentaux, les algorithmes classiques et les réseaux de neurones.",
  startDate: 1737081600, // 16/01/2026
  endDate: null,
  visible: true,
};