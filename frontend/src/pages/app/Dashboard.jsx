// pages/DashboardPage.tsx
import { useEffect, useState } from "react";
import Calender from "@/components/content/Calender";
import { Chronologie } from "@/components/content/Chronologie";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import apiClient from "@/client/apiClient";
import { formatEventsForCalendar } from "@/services/events.service";

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editEvent, setEditEvent] = useState(null);

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

      // 🟢 Appel 2: Récupérer tous les événements (y compris personnels, site et cours)
      const eventsResponse = await apiClient.get("/events");
      const fetchedEvents = eventsResponse.events || [];
      const formattedEvents = formatEventsForCalendar(fetchedEvents);
      
      const enrichedEvents = formattedEvents.map(event => {
        const rawEvent = fetchedEvents.find(e => e.id === event.id);
        const courseTitle = rawEvent?.course?.title || (event.courseId ? "Cours" : null);
        return {
          ...event,
          courseName: courseTitle
        };
      });

      setEvents(enrichedEvents);
    } catch (err) {
      setError(err?.message && !String(err.message).includes("500") ? err.message : "Le tableau de bord est temporairement indisponible.");
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
              Votre centre de contrôle pour les activités et événements.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 mx-auto rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        {/* Layout Principal : Chronologie à gauche + Calendrier à droite */}
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          
          {/* Chronologie des activités (à gauche) */}
          <div className="w-full xl:w-[350px] shrink-0 sticky top-24">
            <Chronologie events={events} onEventClick={setEditEvent} />
          </div>

          {/* Calendrier (à droite) */}
          <div className="flex-1 w-full min-w-0">
            <Calender 
              events={events} 
              courses={courses} 
              onEventCreated={loadDashboardData} 
              editEvent={editEvent}
              onEditEventClose={() => setEditEvent(null)}
              onEventClick={setEditEvent}
            />
          </div>
          
        </div>
      </div>
    </div>
  );
}