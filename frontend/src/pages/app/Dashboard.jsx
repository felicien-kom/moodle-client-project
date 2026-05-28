// pages/DashboardPage.tsx
import { useEffect, useState } from "react";
import { CoursesGrid } from "@/components/courses/CoursesGrid";
import Calender from "@/components/content/Calender";
import { Button } from "@/components/ui/button";
import { RefreshCw, BookOpen, Calendar as CalendarIcon } from "lucide-react";
import apiClient from "@/client/apiClient";
import { getEventsByCourse, formatEventsForCalendar } from "@/services/events.service";

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Charger tous les cours et événements ─────────────────────
  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);

      // 🔵 Appel 1: Récupérer tous les cours de l'utilisateur
      const coursesResponse = await apiClient.get("/courses");
      const fetchedCourses = coursesResponse.courses || [];
      setCourses(fetchedCourses);

      // 🟢 Appel 2: Récupérer les événements de chaque cours
      const allEvents = [];
      for (const course of fetchedCourses) {
        try {
          const courseEvents = await getEventsByCourse(course.id);
          const formattedEvents = formatEventsForCalendar(courseEvents);
          
          const enrichedEvents = formattedEvents.map(event => ({
            ...event,
            courseId: course.id,
            courseName: course.title || "Cours sans titre"
          }));
          
          allEvents.push(...enrichedEvents);
        } catch (err) {
          console.warn(`Erreur chargement événements cours ${course.id}:`, err);
        }
      }

      setEvents(allEvents);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement du tableau de bord");
      console.error("Erreur chargement dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tableau de bord</h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">
              Aperçu de vos cours récents et événements à venir.
            </p>
          </div>
          <Button
            onClick={loadDashboardData}
            variant="outline"
            className="gap-2 bg-white shadow-sm hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            Actualiser
          </Button>
        </div>

        {error && (
          <div className="mb-6 mx-auto rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        {/* Layout Principal : Grille de Cours + Panneau Latéral Calendrier */}
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          
          {/* Main Content: Liste des cours 
          <div className="flex-1 w-full min-w-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center p-2 rounded-lg bg-primary/10 text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Mes Cours Récents</h2>
            </div>
            
            {courses.length > 0 ? (
              <CoursesGrid courses={courses} />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <BookOpen className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-800">Aucun cours trouvé</h3>
                <p className="mt-2 text-sm text-slate-500">Vous n'êtes actuellement inscrit à aucun cours.</p>
              </div>
            )}
          </div>
*/}
          {/* Sidebar: Calendrier */}
          <div className="w-full xl:w-[350px] shrink-0 sticky top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center p-2 rounded-lg bg-primary/10 text-primary">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Événements liés</h2>
            </div>
            
            <div className="rounded-10xl border border-slate-200 bg-white p-5 shadow-sm overflow-hidden">
              <Calender events={events} />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}