import { useCallback, useEffect, useLayoutEffect, useState, useRef } from "react";
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
import FolderView from "./FolderView.jsx";
import RessourcesActicityModal from "@/components/courses/RessourcesActicityModal.jsx";
import { useUserRole } from "@/hooks/useUserRole";

/** Navbar app (64px) + bannière (56px) + onglets (48px) */
const COURSE_NAV_TOP_PX = 168;
const SCROLL_OFFSET = COURSE_NAV_TOP_PX + 12;
const NAV_COLUMN_WIDTH_PX = 208;
const EM_DASH = "—";

function getCourseImage(data) {
  if (!data) return null;
  return data.imageUrl || data.image || null;
}

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
            className={`text-xs shadow-sm h-8 ${isFileDownloadedState ? 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100' : 'bg-primary hover:bg-primary/95'}`}
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
          <Button onClick={(e) => { e.stopPropagation(); console.log("Devoir:", item); }} size="sm" className="text-xs h-8 bg-slate-900 text-white hover:bg-slate-800">
            {isTeacher ? "Soumissions" : "Ma remise"}
          </Button>
        )}
      </div>
    </div>
  );
}

function CourseSection({ section, onFolderClick, onFileDownload, onFileOpen, downloadedFiles = new Set() }) {
  const [open, setOpen] = useState(true);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const { isTeacher } = useUserRole();

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
          {/* Menu pour ajouter un module */}
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
              {isTeacher && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsActivityModalOpen(true); }}>
                  Ajouter un module
                </DropdownMenuItem>
              )}
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

      {/* Modal d'ajout d'activité / ressource */}
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
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
        transition-colors text-left
        ${active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-indigo-700"
        }`}
    >
      {isDetails
        ? <Info className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-indigo-600" : "text-slate-400"}`} />
        : <Layers className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-indigo-600" : "text-slate-400"}`} />
      }
      <span className="truncate">{label}</span>
    </button>
  );
}

function FixedCourseNavigation({ asideRef, navLeft, activeNav, sections, onNavigate }) {
  return (
    <aside ref={asideRef} className="hidden lg:block w-52 shrink-0" aria-label="Navigation du cours">
      <nav
        className="flex flex-col gap-0.5 overflow-y-auto overscroll-contain z-30 bg-slate-50/95 backdrop-blur-sm pr-1 pb-4"
        style={{
          position: "fixed",
          top: COURSE_NAV_TOP_PX,
          left: navLeft,
          width: NAV_COLUMN_WIDTH_PX,
          maxHeight: `calc(100vh - ${COURSE_NAV_TOP_PX}px - 1rem)`,
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1 pt-1">
          Navigation
        </p>
        <NavItem
          label="Détails"
          active={activeNav === "details"}
          onClick={() => onNavigate("details")}
          isDetails
        />
        {sections.map((s) => (
          <NavItem
            key={s.id}
            label={s.navLabel}
            active={activeNav === s.id}
            onClick={() => onNavigate(s.id)}
          />
        ))}
      </nav>
    </aside>
  );
}

// â”€â”€â”€ VUE : DÃ©tail d'un cours â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function CourseDetail({ cours = defaultCours, onRetour }) {
  const [activeNav, setActiveNav] = useState("details");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coursData, setCoursData] = useState(cours);
  const [sections, setSections] = useState([]);
  const [grades, setGrades] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [downloadedFiles, setDownloadedFiles] = useState(() => {
    // Charger les fichiers tÃ©lÃ©chargÃ©s depuis localStorage
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

  const { isTeacher } = useUserRole();
  const canEnroll =
    !isTeacher &&
    Boolean(cours?.isExplorer || coursData?.isExplorer) &&
    Boolean(coursData?.serverId || cours?.serverId);

  const SUCCESS_THRESHOLD = 0.60;
  const courseTitle = coursData?.title || cours?.title || "Cours";
  const courseImage = getCourseImage(coursData) || getCourseImage(cours);

  const studentParticipants = participants.filter((participant) => {
    if (!participant) return false;
    if (participant.role) {
      return String(participant.role).toLowerCase() === "student" || String(participant.role).toLowerCase() === "learner";
    }
    return true;
  });

  const displayParticipants = isTeacher ? participants : studentParticipants;
  const participantsTitle = isTeacher ? "Membres du cours" : "Étudiants inscrits";

  const gradeItems = grades.map((gradeItem) => ({
    name: gradeItem.itemName || "Évaluation",
    score: gradeItem.grade,
    max: gradeItem.maxGrade,
    percentage: gradeItem.percentage ?? (gradeItem.grade != null && gradeItem.maxGrade ? (gradeItem.grade / gradeItem.maxGrade) * 100 : null),
    type: gradeItem.itemType || "evaluation",
  }));

  const gradedItems = gradeItems.filter((item) => item.score != null && item.max != null);
  const averagePercentage = gradedItems.length
    ? gradedItems.reduce((sum, item) => sum + item.percentage, 0) / gradedItems.length
    : 0;
  const completedCount = gradedItems.length;
  const totalEvaluations = gradeItems.length;

  const studentRanking = isTeacher
    ? studentParticipants
        .map((student) => {
          const studentGrades = grades.filter((g) => g.userId === student.id || g.email === student.email);
          const studentGradeItems = studentGrades.map((g) => ({
            score: g.grade,
            max: g.maxGrade,
            percentage: g.percentage ?? (g.grade != null && g.maxGrade ? (g.grade / g.maxGrade) * 100 : null),
          }));
          const gradedStudentItems = studentGradeItems.filter((item) => item.score != null && item.max != null);
          const avgPercentage = gradedStudentItems.length
            ? gradedStudentItems.reduce((sum, item) => sum + item.percentage, 0) / gradedStudentItems.length
            : 0;
          const isSuccessful = avgPercentage >= SUCCESS_THRESHOLD * 100;
          return {
            ...student,
            avgPercentage: Math.round(avgPercentage),
            isSuccessful,
            gradesCount: gradedStudentItems.length,
          };
        })
        .sort((a, b) => b.avgPercentage - a.avgPercentage)
    : [];

  const detailsRef = useRef(null);
  const sectionRefs = useRef({});
  const navAsideRef = useRef(null);
  const [navLeft, setNavLeft] = useState(0);

  useLayoutEffect(() => {
    const updateNavPosition = () => {
      const el = navAsideRef.current;
      if (!el) return;
      setNavLeft(el.getBoundingClientRect().left);
    };

    updateNavPosition();
    window.addEventListener("resize", updateNavPosition);
    window.addEventListener("scroll", updateNavPosition, { passive: true });
    return () => {
      window.removeEventListener("resize", updateNavPosition);
      window.removeEventListener("scroll", updateNavPosition);
    };
  }, [loading, sections.length]);

  const handleFileDownload = async (fileId) => {
    try {
      await downloadFile(fileId);
      setDownloadedFiles(prev => new Set([...prev, fileId]));
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

      loadCourseData();
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      alert("Erreur lors de l'inscription: " + (error.message || error));
    } finally {
      setIsEnrolling(false);
    }
  };

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

  const loadCourseData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!cours?.id) {
        setLoading(false);
        return;
      }

      const courseResponse = await apiClient.get(`/courses/${cours.id}`);
      setCoursData(courseResponse.course || cours);

      try {
        const sectionsResponse = await apiClient.get(`/courses/${cours.id}/sections`);
        const backendSections = sectionsResponse.sections || [];
        const transformedSections = formatSectionsForUI(backendSections);
        setSections(transformedSections);
      } catch (sectionsError) {
        console.error("Erreur sections:", sectionsError);
        setSections([]);
      }

      try {
        const gradesResponse = await apiClient.get(`/courses/${cours.id}/grades`);
        setGrades(gradesResponse.grades || []);
      } catch (gradesError) {
        console.error("Erreur notes:", gradesError);
        setGrades([]);
      }

      try {
        const participantsData = await getParticipantsByCourse(cours.id);
        setParticipants(participantsData || []);
      } catch (participantsError) {
        console.error("Erreur participants:", participantsError);
        setParticipants([]);
      }

    } catch (err) {
      setError(err.message || "Erreur lors du chargement des détails du cours");
      console.error("Erreur chargement cours:", err);
    } finally {
      setLoading(false);
    }
  }, [cours]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  useEffect(() => {
    localStorage.setItem('downloadedFiles', JSON.stringify([...downloadedFiles]));
  }, [downloadedFiles]);

  const scrollTo = useCallback((id) => {
    setActiveNav(id);
    const el = id === "details" ? detailsRef.current : sectionRefs.current[id];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  // â”€â”€â”€ Ã‰tat de chargement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Ã‰tat d'erreur â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Afficher la vue dossier si un dossier est sÃ©lectionnÃ© â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (selectedFolder) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="relative h-14 shrink-0 overflow-hidden bg-indigo-950">
          {courseImage && (
            <>
              <img src={courseImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
              <div className="absolute inset-0 bg-indigo-950/70" />
            </>
          )}
          <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center gap-2 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedFolder(null)}
              className="h-8 w-8 shrink-0 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="truncate text-base font-bold text-white">
              {selectedFolder.nom || courseTitle}
            </h1>
          </div>
        </div>

        <Tabs defaultValue="cours" className="w-full flex-1">
          <div className="border-b border-slate-200 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <TabsList className="h-12 w-full justify-start rounded-none bg-transparent p-0 gap-6">
                <TabsTrigger value="cours" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-0 pb-3">
                  Contenu
                </TabsTrigger>
                <TabsTrigger value="participants" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-0 pb-3">
                  Participants
                </TabsTrigger>
                <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-0 pb-3">
                  Notes
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          <TabsContent value="cours" className="mt-0">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
              <FolderView
                folder={selectedFolder}
                onRetour={() => setSelectedFolder(null)}
                downloadedFiles={downloadedFiles}
              />
            </div>
          </TabsContent>
          <TabsContent value="participants">
            <Card className="border border-gray-200 shadow-none rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{participantsTitle}</h3>
                    <p className="text-sm text-slate-500">{displayParticipants.length} participant{displayParticipants.length > 1 ? "s" : ""} inscrit{displayParticipants.length > 1 ? "s" : ""} au cours</p>
                  </div>
                  {isTeacher && (
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">Vue enseignant</Badge>
                  )}
                </div>
                {displayParticipants.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {displayParticipants.map((participant) => (
                      <li key={participant.id} className="py-3 text-sm text-gray-700 font-medium font-sans flex items-center justify-between gap-3">
                        <span>{participant.fullname}</span>
                        {participant.email && <span className="text-xs text-slate-400 truncate">{participant.email}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 font-sans">Aucun participant visible pour ce cours.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notes">
            <div className="grid gap-4">
              <Card className="border border-gray-200 shadow-none rounded-xl">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em] text-slate-500 font-semibold">Bulletin de notes</p>
                      <h3 className="text-xl font-bold text-slate-900">{isTeacher ? "Carnet de notes" : "Mon bulletin"}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 text-center">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">Évaluations</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{totalEvaluations}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">Corrigées</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{completedCount}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">Moyenne</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{gradedItems.length ? `${averagePercentage.toFixed(0)}%` : EM_DASH}</p>
                      </div>
                    </div>
                  </div>
                  {gradeItems.length > 0 ? (
                    <div className="overflow-hidden rounded-3xl border border-slate-200">
                      <div className="grid grid-cols-12 gap-2 bg-slate-50 px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-slate-500 font-semibold">
                        <span className="col-span-5">Évaluation</span>
                        <span className="col-span-2 text-center">Note</span>
                        <span className="col-span-2 text-center">Max</span>
                        <span className="col-span-3 text-center">Taux</span>
                      </div>
                      <div className="divide-y divide-slate-100 bg-white">
                        {gradeItems.map((item, index) => (
                          <div key={`${item.name}-${index}`} className="grid grid-cols-12 gap-2 px-4 py-4 text-sm text-slate-700 items-center">
                            <div className="col-span-5">
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-xs text-slate-400">{item.type}</p>
                            </div>
                            <div className="col-span-2 text-center">
                              {item.score != null ? item.score : EM_DASH}
                            </div>
                            <div className="col-span-2 text-center text-slate-500">
                              {item.max != null ? item.max : EM_DASH}
                            </div>
                            <div className="col-span-3 text-center font-semibold text-slate-900">
                              {item.percentage != null ? `${item.percentage.toFixed(0)}%` : EM_DASH}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center">
                      <p className="text-sm text-slate-500">Aucune note disponible pour ce cours pour le moment.</p>
                      <p className="text-xs text-slate-400 mt-2">Synchronisez le cours ou créez des évaluations pour obtenir des résultats.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Utiliser les sections du backend
  const formatSectionNavLabel = (title) => {
    if (!title) return "Section";
    return title.split(/[—–]/)[0].trim();
  };

  const displaySections = sections.map((s) => ({
    ...s,
    navLabel: formatSectionNavLabel(s.titre),
  }));

  const formatDate = (timestamp) => {
    if (!timestamp) return "Non définie";
    return new Date(timestamp * 1000).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Bannière compacte (titre + image discrète) */}
      <div className="relative h-14 shrink-0 overflow-hidden bg-indigo-950">
        {courseImage && (
          <>
            <img
              src={courseImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-indigo-950/70" />
          </>
        )}
        <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRetour}
              className="h-8 w-8 shrink-0 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Retour à la liste des cours"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="truncate text-base sm:text-lg font-bold text-white">
              {courseTitle}
            </h1>
          </div>
          {canEnroll && (
            <Button
              size="sm"
              onClick={handleEnrollClick}
              className="h-8 shrink-0 bg-white text-indigo-900 hover:bg-white/90 text-xs px-3"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              S&apos;inscrire
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="cours" className="w-full flex-1">
        <div className="border-b border-slate-200 bg-white sticky top-16 z-20 shrink-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <TabsList className="h-12 w-full justify-start rounded-none bg-transparent p-0 gap-8">
              <TabsTrigger
                value="cours"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
              >
                Contenu
              </TabsTrigger>
              <TabsTrigger
                value="participants"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
              >
                Participants
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
              >
                Notes
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="cours" className="mt-0 focus-visible:outline-none">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-6 lg:gap-8 items-start">
            <FixedCourseNavigation
              asideRef={navAsideRef}
              navLeft={navLeft}
              activeNav={activeNav}
              sections={displaySections}
              onNavigate={scrollTo}
            />

            <main className="flex-1 min-w-0 flex flex-col gap-4">
              <div
                ref={detailsRef}
                className="scroll-mt-[11rem] rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-5">Détails du cours</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Nom court</p>
                      <p className="text-[15px] font-semibold text-slate-900">
                        {coursData.shortName ?? coursData.title?.slice(0, 8)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Sections</p>
                      <p className="text-[15px] font-semibold text-slate-900">
                        {displaySections.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Début</p>
                      <p className="text-[15px] font-semibold text-slate-900">
                        {formatDate(coursData.startDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Fin</p>
                      <p className="text-[15px] font-semibold text-slate-900">
                        {formatDate(coursData.endDate)}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-5" />
                  <div>
                    <p className="text-xs text-slate-400 mb-1.5">Description</p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {coursData.summary ?? "Aucune description disponible."}
                    </p>
                  </div>
                </CardContent>
              </div>

              {displaySections.length > 0 ? (
                displaySections.map((section) => (
                  <div
                    key={section.id}
                    ref={(el) => {
                      if (el) sectionRefs.current[section.id] = el;
                    }}
                    className="scroll-mt-[11rem] rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                  >
                    <CourseSection
                      section={section}
                      onFolderClick={setSelectedFolder}
                      onFileDownload={handleFileDownload}
                      onFileOpen={handleFileOpen}
                      downloadedFiles={downloadedFiles}
                    />
                  </div>
                ))
              ) : (
                <Card className="border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-slate-500">
                      Le contenu du cours n&apos;est pas disponible pour le moment.
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Veuillez synchroniser le cours ou contacter l&apos;administrateur.
                    </p>
                  </CardContent>
                </Card>
              )}

              {isTeacher && (
                <Button
                  onClick={handleAddSectionClick}
                  className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base border-2 border-dashed border-indigo-300 rounded-xl flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter une section
                </Button>
              )}
            </main>
          </div>
        </TabsContent>

        <TabsContent value="participants" className="mt-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border border-slate-200 shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{participantsTitle}</h3>
                  <p className="text-sm text-gray-500">{displayParticipants.length} participant{displayParticipants.length > 1 ? "s" : ""} inscrit{displayParticipants.length > 1 ? "s" : ""} au cours</p>
                </div>
                {isTeacher && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">Vue enseignant</Badge>
                )}
              </div>
              {displayParticipants.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {displayParticipants.map((participant) => (
                    <li key={participant.id} className="py-3 text-sm text-gray-700 font-medium font-sans flex items-center justify-between gap-3">
                      <span>{participant.fullname}</span>
                      {participant.email && <span className="text-xs text-slate-400 truncate">{participant.email}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 font-sans">Aucun participant visible pour ce cours.</p>
              )}
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid gap-4">
            {isTeacher ? (
              <>
                <Card className="border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <p className="text-sm uppercase tracking-[0.22em] text-slate-500 font-semibold">Suivi des performances</p>
                      <h3 className="text-xl font-bold text-slate-900">Classement des étudiants</h3>
                      <p className="text-xs text-slate-400 mt-1">Seuil de réussite : {Math.round(SUCCESS_THRESHOLD * 100)}%</p>
                    </div>
                    {studentRanking.length > 0 ? (
                      <div className="overflow-hidden rounded-3xl border border-slate-200">
                        <div className="grid grid-cols-12 gap-2 bg-slate-50 px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-slate-500 font-semibold">
                          <span className="col-span-1 text-center">#</span>
                          <span className="col-span-4">Étudiant</span>
                          <span className="col-span-2 text-center">Moyenne</span>
                          <span className="col-span-2 text-center">Éval.</span>
                          <span className="col-span-3 text-center">Statut</span>
                        </div>
                        <div className="divide-y divide-slate-100 bg-white">
                          {studentRanking.map((student, index) => (
                            <div key={student.id} className="grid grid-cols-12 gap-2 px-4 py-4 text-sm text-slate-700 items-center">
                              <div className="col-span-1 text-center font-bold text-indigo-600">{index + 1}</div>
                              <div className="col-span-4">
                                <p className="font-semibold">{student.fullname}</p>
                                <p className="text-xs text-slate-400">{student.email}</p>
                              </div>
                              <div className="col-span-2 text-center font-semibold text-slate-900">{student.avgPercentage}%</div>
                              <div className="col-span-2 text-center text-slate-500">{student.gradesCount}</div>
                              <div className="col-span-3 text-center">
                                {student.avgPercentage > 0 ? (
                                  <Badge className={student.isSuccessful ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>
                                    {student.isSuccessful ? "Réussi" : "En cours"}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">{EM_DASH}</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center">
                        <p className="text-sm text-slate-500">Aucun étudiant dans ce cours pour le moment.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="border border-slate-200 shadow-sm rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <div>
                        <p className="text-sm uppercase tracking-[0.22em] text-slate-500 font-semibold">Bulletin de notes</p>
                        <h3 className="text-xl font-bold text-slate-900">Mon bulletin</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 text-center">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">Évaluations</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">{totalEvaluations}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">Corrigées</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">{completedCount}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">Moyenne</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">{gradedItems.length ? `${averagePercentage.toFixed(0)}%` : EM_DASH}</p>
                        </div>
                      </div>
                    </div>
                    {gradeItems.length > 0 ? (
                      <div className="overflow-hidden rounded-3xl border border-slate-200">
                        <div className="grid grid-cols-12 gap-2 bg-slate-50 px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-slate-500 font-semibold">
                          <span className="col-span-5">Évaluation</span>
                          <span className="col-span-2 text-center">Note</span>
                          <span className="col-span-2 text-center">Max</span>
                          <span className="col-span-3 text-center">Taux</span>
                        </div>
                        <div className="divide-y divide-slate-100 bg-white">
                          {gradeItems.map((item, index) => (
                            <div key={`${item.name}-${index}`} className="grid grid-cols-12 gap-2 px-4 py-4 text-sm text-slate-700 items-center">
                              <div className="col-span-5">
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-xs text-slate-400">{item.type}</p>
                              </div>
                              <div className="col-span-2 text-center">
                                {item.score != null ? item.score : EM_DASH}
                              </div>
                              <div className="col-span-2 text-center text-slate-500">
                                {item.max != null ? item.max : EM_DASH}
                              </div>
                              <div className="col-span-3 text-center font-semibold text-slate-900">
                                {item.percentage != null ? `${item.percentage.toFixed(0)}%` : EM_DASH}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center">
                        <p className="text-sm text-slate-500">Aucune note disponible pour ce cours pour le moment.</p>
                        <p className="text-xs text-slate-400 mt-2">Synchronisez le cours ou complétez les évaluations pour obtenir des résultats.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {canEnroll && (
      <Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer inscription</DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment vous inscrire au cours "{coursData.title || cours.title}" ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEnrollModalOpen(false)}
              disabled={isEnrolling}
            >
              Annuler
            </Button>
            <Button
              onClick={handleEnrollConfirm}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isEnrolling}
            >
              {isEnrolling ? "Inscription..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {canEnroll && (
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
              Vous êtes maintenant inscrit au cours &quot;{coursData.title || cours.title}&quot;.
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
      )}

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

// â”€â”€â”€ Valeur par dÃ©faut si cours non fourni (alignÃ©e sur schema.prisma) â”€â”€â”€â”€â”€â”€â”€â”€
const defaultCours = {
  title: "Machine Learning",
  shortName: "ML",
  categoryName: "Catégorie 1",
  summary: "Cours complet de Machine Learning couvrant les fondamentaux, les algorithmes classiques et les réseaux de neurones.",
  startDate: 1737081600, // 16/01/2026
  endDate: null,
  visible: true,
};