// pages/DashboardPage.tsx
import { useEffect, useState } from "react";
import { Chronologie } from "@/components/content/Chronologie";
//import { Calendrier } from "@/components/content/Calendrier";
import { Button } from "@/components/ui/button";
import Calender from "@/components/content/Calender";
import { RefreshCw } from "lucide-react";
import apiClient from "@/client/apiClient";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Charger tous les événements depuis tous les cours ─────────────────────
  useEffect(() => {
    loadAllEvents();
  }, []);

  async function loadAllEvents() {
    try {
      setLoading(true);
      setError(null);

      // 🔵 Appel 1: Récupérer tous les cours de l'utilisateur
      const coursesResponse = await apiClient.get("/courses");
      const courses = coursesResponse.courses || [];

      // 🟢 Appel 2: Récupérer les événements de chaque cours
      const allEvents = [];
      for (const course of courses) {
        try {
          const eventsResponse = await apiClient.get(`/courses/${course.id}/events`);
          const courseEvents = eventsResponse.events || [];
          
          // Enrichir les événements avec les informations du cours
          const enrichedEvents = courseEvents.map(event => ({
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
      setError(err.message || "Erreur lors du chargement des événements");
      console.error("Erreur chargement événements:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* <Navbar /> */} {/* Navbar maintenant dans AppLayout */}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">Tableau de bord</h1>
            <p className="text-gray-500 text-sm mt-1">
              Votre centre de contrôle pour les activités et événements.
            </p>
          </div>
          <Button
            onClick={loadAllEvents}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
        </div>

        {/* Contenu : 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <Chronologie events={events} />
          
          <Calender events={events} />
        </div>
      </div>
    </div>
  );
}