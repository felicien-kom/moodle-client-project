// components/Chronologie.tsx
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Globe, BookOpen, FileText, Calendar } from "lucide-react";

// Icônes par type d'événement
const TYPE_ICONS = {
  "cours": { icon: BookOpen, color: "text-green-600", bg: "bg-green-100" },
  "site": { icon: Globe, color: "text-red-500", bg: "bg-red-100" },
  "categorie": { icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
  "utilisateur": { icon: Calendar, color: "text-purple-600", bg: "bg-purple-100" },
  "due": { icon: FileText, color: "text-amber-600", bg: "bg-amber-100" },
  "gradingdue": { icon: FileText, color: "text-rose-600", bg: "bg-rose-100" },
  "default": { icon: Calendar, color: "text-gray-600", bg: "bg-gray-100" }
};


const TYPE_COLORS = {
  "cours": "bg-green-100 text-green-700",
  "site": "bg-blue-100 text-blue-700",
  "categorie": "bg-purple-100 text-purple-700",
  "utilisateur": "bg-gray-100 text-gray-700",
  "due": "bg-amber-100 text-amber-700",
  "gradingdue": "bg-rose-100 text-rose-700",
  "default": "bg-gray-100 text-gray-700"
};

const TYPE_MAPPING = {
  "course": "cours",
  "cours": "cours",
  "site": "site",
  "category": "categorie",
  "categorie": "categorie",
  "user": "utilisateur",
  "utilisateur": "utilisateur",
  "group": "groupe",
  "groupe": "groupe",
  "due": "due",
  "gradingdue": "gradingdue"
};

const TYPE_DISPLAY_NAMES = {
  "cours": "Cours",
  "site": "Site",
  "categorie": "Catégorie",
  "utilisateur": "Utilisateur",
  "groupe": "Groupe",
  "due": "Échéance",
  "gradingdue": "Correction",
  "default": "Événement"
};

export function Chronologie({ events = [], onEventClick }) {
  const [filterType, setFilterType] = useState("tous");
  const [filterDate, setFilterDate] = useState("toutes");

  const getNormalizedType = (event) => {
    const rawType = (event.eventType || event.type || "default").toLowerCase();
    return TYPE_MAPPING[rawType] || rawType;
  };

  // ─── Filtrer les événements ──────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Filtrer par type
    if (filterType !== "tous") {
      result = result.filter(event => {
        const type = getNormalizedType(event);
        return type === filterType.toLowerCase();
      });
    }

    // Filtrer par date
    if (filterDate === "semaine") {
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      result = result.filter(event => {
        const eventDate = new Date(event.timeStart * 1000 || event.date);
        return eventDate >= today && eventDate <= weekFromNow;
      });
    } else if (filterDate === "mois") {
      const today = new Date();
      const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      result = result.filter(event => {
        const eventDate = new Date(event.timeStart * 1000 || event.date);
        return eventDate >= today && eventDate <= monthFromNow;
      });
    } else {
      // Toutes les activités à venir
      const today = new Date();
      result = result.filter(event => {
        const eventDate = new Date(event.timeStart * 1000 || event.date);
        return eventDate >= today;
      });
    }

    // Trier par date
    return result.sort((a, b) => {
      const dateA = new Date(a.timeStart * 1000 || a.date);
      const dateB = new Date(b.timeStart * 1000 || b.date);
      return dateA - dateB;
    });
  }, [events, filterType, filterDate]);

  // ─── Déterminer l'icône et les couleurs ──────────────────────────────────
  function getEventInfo(event) {
    const type = getNormalizedType(event);
    const typeConfig = TYPE_ICONS[type] || TYPE_ICONS.default;
    const typeColor = TYPE_COLORS[type] || TYPE_COLORS.default;
    const displayType = TYPE_DISPLAY_NAMES[type] || TYPE_DISPLAY_NAMES.default;

    return { typeConfig, typeColor, displayType };
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-slate-800">
          Chronologie des activités
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtres */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Échéance</label>
          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="w-full bg-gray-50 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes (à venir)</SelectItem>
              <SelectItem value="semaine">Cette semaine</SelectItem>
              <SelectItem value="mois">Ce mois</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Type d'événement</label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full bg-gray-50 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-sm text-slate-800">
              <SelectItem value="tous">Tous les types</SelectItem>
              <SelectItem value="cours">Cours</SelectItem>
              <SelectItem value="site">Site</SelectItem>
              <SelectItem value="categorie">Catégorie</SelectItem>
              <SelectItem value="utilisateur">Utilisateur</SelectItem>
              <SelectItem value="due">Échéance</SelectItem>
              <SelectItem value="gradingdue">Correction</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des activités */}
        <ScrollArea className="h-72">
          <div className="space-y-3 pr-2">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => {
                const { typeConfig, typeColor, displayType } = getEventInfo(event);
                const Icon = typeConfig.icon;
                const eventDate = new Date(event.timeStart * 1000 || event.date);
                const formattedDate = eventDate.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick && onEventClick(event)}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 
                               cursor-pointer transition-colors border border-transparent 
                               hover:border-gray-200"
                  >
                    <div className={`p-2 rounded-full ${typeConfig.bg} shrink-0`}>
                      <Icon className={`h-4 w-4 ${typeConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {event.name || event.title || "Événement sans titre"}
                        </span>
                        <Badge className={`text-xs shrink-0 border-0 ${typeColor}`}>
                          {displayType}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formattedDate}
                      </p>
                      {event.courseName && (
                        <p className="text-xs text-gray-400">{event.courseName}</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-400">
                <p className="text-sm">Aucun événement trouvé</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}