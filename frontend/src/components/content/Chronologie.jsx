// components/Chronologie.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Globe, BookOpen, FileText } from "lucide-react";

const activities = [
  {
    id: 1, icon: Globe, color: "text-red-500", bg: "bg-red-100",
    title: "bonjour toud", type: "Site", typeColor: "bg-blue-100 text-blue-700",
    date: "Le 07/01/2026 à 12:56",
  },
  {
    id: 2, icon: BookOpen, color: "text-green-600", bg: "bg-green-100",
    title: "en gfant qu'in...", type: "Catégorie", typeColor: "bg-purple-100 text-purple-700",
    date: "Le 09/01/2026 à 17:35", sub: "Category 1",
  },
  {
    id: 3, icon: FileText, color: "text-blue-600", bg: "bg-blue-100",
    title: "glog", type: "Cours", typeColor: "bg-green-100 text-green-700",
    date: "Le 13/01/2026 à 12:00", sub: "IHM",
  },
  {
    id: 4, icon: FileText, color: "text-blue-600", bg: "bg-blue-100",
    title: "TD 4 envoyer", type: "Cours", typeColor: "bg-green-100 text-green-700",
    date: "Le 14/01/2026 à 16:12",
  },
];

export function Chronologie() {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-black">
          Chronologie des activités
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtres */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Échéance</label>
          <Select defaultValue="toutes">
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
          <Select defaultValue="tous">
            <SelectTrigger className="w-full bg-gray-50 border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les types</SelectItem>
              <SelectItem value="cours">Cours</SelectItem>
              <SelectItem value="site">Site</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des activités */}
        <ScrollArea className="h-72">
          <div className="space-y-3 pr-2">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 
                           cursor-pointer transition-colors border border-transparent 
                           hover:border-gray-200"
              >
                <div className={`p-2 rounded-full ${act.bg} shrink-0`}>
                  <act.icon className={`h-4 w-4 ${act.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-black truncate">
                      {act.title}
                    </span>
                    <Badge className={`text-xs shrink-0 ${act.typeColor} border-0`}>
                      {act.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{act.date}</p>
                  {act.sub && (
                    <p className="text-xs text-gray-400">{act.sub}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}