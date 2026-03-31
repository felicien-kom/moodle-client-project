// pages/DashboardPage.tsx
import { Chronologie } from "@/components/content/Chronologie";
//import { Calendrier } from "@/components/content/Calendrier";
import { Button } from "@/components/ui/button";
import Calender from "@/components/content/Calender";
import { RefreshCw } from "lucide-react";

export default function Dashboard() {
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

        </div>

        {/* Contenu : 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <Chronologie />
          
          <Calender />
        </div>
      </div>
    </div>
  );
}