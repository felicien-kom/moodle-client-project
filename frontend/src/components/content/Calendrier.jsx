// components/Calendrier.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const DAYS_HEADER = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Événements exemple (jour → liste)
const events = {
  7:  [{ label: "bonjour t..", color: "bg-red-200 text-red-800" }],
  9:  [{ label: "en gfant q..", color: "bg-green-200 text-green-800" }],
  13: [{ label: "glog", color: "bg-blue-200 text-blue-800" }],
  14: [{ label: "TD 4 envo..", color: "bg-blue-200 text-blue-800" }],
  15: [{ label: "nen n'est..", color: "bg-orange-200 text-orange-800" }],
  17: [{ label: "lmloutds", color: "bg-purple-200 text-purple-800" }, { label: "jeudi les a..", color: "bg-teal-200 text-teal-800" }],
  20: [{ label: "jxhjxhk", color: "bg-indigo-200 text-indigo-800" }],
  22: [{ label: "Physique..", color: "bg-pink-200 text-pink-800" }, { label: "mimi", color: "bg-yellow-200 text-yellow-800" }],
  23: [{ label: "lseee", color: "bg-green-200 text-green-800" }, { label: "jqftfhgkl..", color: "bg-blue-200 text-blue-800" }],
  25: [{ label: "lolita", color: "bg-pink-200 text-pink-800" }, { label: "yo les gars", color: "bg-orange-200 text-orange-800" }],
  26: [{ label: "fermeture..", color: "bg-red-200 text-red-800" }, { label: "vous éla t..", color: "bg-blue-200 text-blue-800" }],
  27: [{ label: "patate", color: "bg-green-200 text-green-800" }, { label: "patate", color: "bg-green-200 text-green-800" }],
  28: [{ label: "patate", color: "bg-green-200 text-green-800" }, { label: "Tamo Geo..", color: "bg-teal-200 text-teal-800" }],
  29: [{ label: "nogr", color: "bg-orange-200 text-orange-800" }, { label: "De voir de..", color: "bg-blue-200 text-blue-800" }, { label: "De voir de..", color: "bg-blue-200 text-blue-800" }],
  30: [{ label: "ouverture", color: "bg-green-200 text-green-800" }, { label: "fermeture", color: "bg-red-200 text-red-800" }],
};

// Janvier 2026 commence un jeudi (index 3 dans Lun-Dim)
const FIRST_DAY_OFFSET = 3;
const DAYS_IN_MONTH = 31;

export function Calendrier() {
  const [month] = useState("janvier 2026");

  const cells=[
    ...Array(FIRST_DAY_OFFSET).fill(null),
    ...Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1),
  ];
  // Pad to complete grid
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-black">Calendrier</CardTitle>
          <div className="flex items-center gap-3">
            <Select defaultValue="tous">
              <SelectTrigger className="w-36 bg-gray-50 border-gray-200 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les cours</SelectItem>
                <SelectItem value="ihm">IHM</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-indigo-900 hover:bg-indigo-800 text-white flex items-center gap-1 text-sm">
              <Plus className="h-4 w-4" />
              Nouvel événement
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Navigation mois */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-black">{month}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Grille */}
        <div className="grid grid-cols-7 gap-1">
          {/* En-têtes jours */}
          {DAYS_HEADER.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">
              {d}
            </div>
          ))}

          {/* Cellules */}
          {cells.map((day, idx) => (
            <div
              key={idx}
              className={`min-h-[70px] rounded-lg p-1 text-xs ${
                day ? "hover:bg-gray-50 cursor-pointer" : ""
              }`}
            >
              {day && (
                <>
                  <span className="text-gray-700 font-medium text-xs mb-1 block">
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {(events[day] || []).slice(0, 2).map((ev, i) => (
                      <div
                        key={i}
                        className={`text-[10px] px-1 py-0.5 rounded truncate ${ev.color}`}
                      >
                        {ev.label}
                      </div>
                    ))}
                    {(events[day] || []).length > 2 && (
                      <div className="text-[10px] text-gray-400 pl-1">
                        +{(events[day] || []).length - 2} autres
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}