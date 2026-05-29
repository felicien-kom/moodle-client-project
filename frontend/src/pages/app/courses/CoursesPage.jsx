import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Search, BookOpen, Compass, UserCheck, LayoutGrid } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { getAllLocalCourses, getCatalogueOnline } from "@/services/courses.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoursesGrid } from "@/components/courses/CoursesGrid";
import { EmptyState } from "@/components/courses/EmptyState";
import { CoursesHeader } from "@/components/courses/CoursesHeader";
import { PATHS } from "@/router/paths";

// Images génériques pour le catalogue
import genericBanner1 from "@/assets/img/explore/explore-banner-01.png";
import genericBanner2 from "@/assets/img/explore/explore-banner-02.png";
import genericBanner3 from "@/assets/img/explore/explore-banner-03.png";
import genericBanner4 from "@/assets/img/explore/explore-banner-04.png";
const genericBanners = [genericBanner1, genericBanner2, genericBanner3, genericBanner4];

const TABS = {
  teacher: [{ id: "created", label: "Mes cours créés", icon: LayoutGrid }],
  student: [
    { id: "enrolled", label: "Mes cours inscrits", icon: UserCheck },
    { id: "explore", label: "Explorer les cours", icon: Compass },
  ],
};

export default function CoursesPage() {
  const navigate = useNavigate();
  const { role, user, isTeacher, isStudent } = useUserRole();

  const [activeTab, setActiveTab] = useState("");
  const [allCourses, setAllCourses] = useState([]);
  const [catalogueCourses, setCatalogueCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (role) {
      const defaultTab = role === 'teacher' ? 'created' : 'enrolled';
      setActiveTab(defaultTab);
      loadCourses(defaultTab);
    }
  }, [role]);

  const loadCourses = async (tab) => {
    setIsLoading(true);
    try {
      if (tab === 'enrolled' || tab === 'created') {
        const courses = await getAllLocalCourses();
        setAllCourses(courses);
      } else if (tab === 'explore') {
        const catalogue = await getCatalogueOnline();
        // Assigner des images génériques pour l'exploration
        const coursesWithGenericImages = catalogue.courses.map((course, index) => ({
          ...course,
          image: genericBanners[index % genericBanners.length],
          isPlaceholder: true, // Marqueur pour la carte
        }));
        setCatalogueCourses(coursesWithGenericImages);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des cours:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    loadCourses(tabId);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const getFilteredCourses = () => {
    let coursesToFilter = [];
    if (activeTab === 'created') {
      // Filtrer les cours créés par l'enseignant
      coursesToFilter = allCourses.filter(course => String(course.createdBy) === String(user?.moodleUserId));
    } else if (activeTab === 'enrolled') {
      // Filtrer les cours où l'étudiant est inscrit
      coursesToFilter = allCourses.filter(course => course.isEnrolled);
    } else if (activeTab === 'explore') {
      coursesToFilter = catalogueCourses;
    }

    if (!searchTerm) return coursesToFilter;

    return coursesToFilter.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredCourses = getFilteredCourses();
  const currentTabs = TABS[role] || [];

  const renderEmptyState = () => {
    if (isLoading) return null;
    if (filteredCourses.length > 0) return null;

    if (activeTab === 'created') {
      return <EmptyState
        icon={BookOpen}
        title="Vous n'avez encore créé aucun cours"
        description="Commencez à partager votre savoir. Créez votre premier cours et guidez vos étudiants."
        buttonLabel="Créer un nouveau cours"
        onAction={() => navigate(PATHS.app.createCourse)}
      />;
    }
    if (activeTab === 'enrolled') {
      return <EmptyState
        icon={Compass}
        title="Vous n'êtes inscrit à aucun cours"
        description="Parcourez le catalogue pour découvrir de nouvelles compétences et vous inscrire."
        buttonLabel="Explorer les cours"
        onAction={() => handleTabChange('explore')}
      />;
    }
    if (activeTab === 'explore' && searchTerm) {
       return <EmptyState
        icon={Search}
        title="Aucun résultat"
        description={`Votre recherche pour "${searchTerm}" n'a donné aucun résultat.`}
      />;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <CoursesHeader
        title="Espace des cours"
        tabs={currentTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showCreateButton={isTeacher}
        onCreateClick={() => navigate(PATHS.app.createCourse)}
      />

      <main className="flex-1 overflow-y-auto bg-slate-50/80 p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto">
          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Rechercher un cours par son nom..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full max-w-lg pl-11 pr-4 py-2.5 h-12 text-base border-slate-200 bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Grille de cours ou état vide */}
          {filteredCourses.length > 0 ? (
            <CoursesGrid
              courses={filteredCourses}
              isLoading={isLoading}
              onCardViewDetails={(courseId) => navigate(`/app/course/${courseId}`)}
            />
          ) : (
            renderEmptyState()
          )}
        </div>
      </main>
    </div>
  );
}
