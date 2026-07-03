import { useState, useMemo, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createEvent, updateEvent } from "@/services/events.service";

// ─── Constantes ──────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const DAY_NAMES_LONG  = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const DAY_NAMES_SHORT = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

// Couleurs cycliques pour les événements (classes Tailwind)
const EV_COLORS = [
  { bg: "bg-red-100", text: "text-red-800" },
  { bg: "bg-blue-100", text: "text-blue-800" },
  { bg: "bg-green-100", text: "text-green-800" },
  { bg: "bg-purple-100", text: "text-purple-800" },
  { bg: "bg-orange-100", text: "text-orange-800" },
  { bg: "bg-teal-100", text: "text-teal-800" },
  { bg: "bg-pink-100", text: "text-pink-800" },
  { bg: "bg-yellow-100", text: "text-yellow-800" },
  { bg: "bg-[#2A78C2]/20", text: "text-[#1F69AE]" },
];


// ─── Utilitaires ─────────────────────────────────────────────────────────────

/** Nombre de jours dans un mois */
function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

/**
 * Offset du premier jour du mois (Lundi = 0 … Dimanche = 6)
 */
function firstDayOffset(y, m) {
  const d = new Date(y, m, 1).getDay(); // JS: 0=dim, 1=lun…
  return d === 0 ? 6 : d - 1;
}

/** Clé unique pour un jour */
function toKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ─── Sous-composants internes ─────────────────────────────────────────────────

/** Pastille d'événement dans la cellule */
function EventPill({ ev, onClick }) {
  const c = EV_COLORS[ev.color % EV_COLORS.length];
  return (
    <div
      title={ev.label}
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick(ev);
      }}
      className={`${c.bg} ${c.text} text-xs px-1.5 py-0.5 rounded-full truncate w-full mb-0.5 cursor-pointer font-medium hover:brightness-95 transition-all`}
    >
      {ev.label}
    </div>
  );
}

/** Cellule d'un jour */
function DayCell({ day, events = [], isToday, isSelected, onClick, onEventClick }) {
  return (
    <div
      onClick={onClick}
      className={`min-h-[76px] rounded-lg p-1 cursor-pointer transition-colors ${
        day ? "hover:bg-gray-50" : ""
      } ${
        isSelected ? "bg-blue-50 outline outline-1.5 outline-blue-200" : ""
      }`}
    >
      {day && (
        <>
          {/* Numéro du jour */}
          <div className="mb-1">
            {isToday ? (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-white text-sm font-bold">
                {day}
              </span>
            ) : (
              <span className={`text-sm font-medium ${
                isSelected ? "text-blue-700" : "text-slate-800"
              }`}>
                {day}
              </span>
            )}
          </div>
          {/* Événements (max 2 + compteur) */}
          <div>
            {events.slice(0, 2).map(ev => (
              <EventPill key={ev.id} ev={ev} onClick={onEventClick} />
            ))}
            {events.length > 2 && (
              <span className="text-[9px] text-gray-400 pl-1">
                +{events.length - 2} autres
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Bouton de navigation (flèche) */
function NavBtn({ onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded border border-gray-200 bg-white text-gray-600 text-sm font-semibold cursor-pointer flex items-center justify-center transition-colors hover:bg-gray-50 flex-shrink-0"
    >
      {children}
    </button>
  );
}

/** Modal ajout d'événement */

/** Panneau détail d'un jour sélectionné */

// ─── Composant principal : Calendrier ─────────────────────────────────────────

export default function Calender({
  events: backendEvents = [],
  courses = [],
  onEventCreated,
  editEvent,
  onEditEventClose,
  onEventClick
}) {
  const today = new Date();

  // État navigation
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // État sélection
  const [selectedDay, setSelectedDay] = useState(null);

  // État filtrage et création d'événements
  const [filterType, setFilterType] = useState("tous");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    time: "08:00",
    eventType: "user",
    courseId: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);

  // Un événement n'est éditable que si on n'est pas en train d'éditer ou si l'événement en cours d'édition est personnel ("user")
  const isReadOnly = useMemo(() => {
    if (!editingEventId) return false;
    const event = backendEvents.find(e => e.id === editingEventId);
    if (!event) return false;
    const type = (event.eventType || event.type || "").toLowerCase();
    return type !== "user";
  }, [editingEventId, backendEvents]);

  // Effet réactif pour préremplir le formulaire en mode édition/consultation
  useEffect(() => {
    if (editEvent) {
      const rawEvent = backendEvents.find(e => e.id === editEvent.id) || editEvent;
      
      const eventDate = new Date(rawEvent.timeStart * 1000);
      const dateStr = toKey(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const timeStr = `${String(eventDate.getHours()).padStart(2, "0")}:${String(eventDate.getMinutes()).padStart(2, "0")}`;

      const rawType = (rawEvent.eventType || rawEvent.type || "user").toLowerCase();
      let normalizedType = rawType;
      if (rawType === "cours" || rawType === "course") normalizedType = "course";
      if (rawType === "utilisateur" || rawType === "user") normalizedType = "user";

      setFormData({
        name: rawEvent.name || rawEvent.title || rawEvent.label || "",
        description: rawEvent.description || "",
        date: dateStr,
        time: timeStr,
        eventType: normalizedType === "course" ? "course" : "user",
        courseId: rawEvent.courseId ? String(rawEvent.courseId) : ""
      });
      setEditingEventId(rawEvent.id);
      setSubmitError(null);
      setIsDialogOpen(true);
    }
  }, [editEvent, backendEvents]);

  // ─── Convertir les événements du backend en format calendrier ─────────────
  const calendarEvents = useMemo(() => {
    const grouped = {};

    // Convertir les événements du backend en format calendrier
    backendEvents.forEach(event => {
      if (event.timeStart) {
        // Obtenir le type normalisé pour le filtrage
        const rawType = (event.eventType || event.type || "default").toLowerCase();
        let normalizedType = rawType;
        if (rawType === "course") normalizedType = "cours";
        if (rawType === "user") normalizedType = "utilisateur";
        if (rawType === "category") normalizedType = "categorie";
        if (rawType === "group") normalizedType = "groupe";

        // Filtrer par type si sélectionné
        if (filterType !== "tous") {
          if (filterType === "cours" && normalizedType !== "cours") return;
          if (filterType === "utilisateur" && normalizedType !== "utilisateur") return;
          if (filterType === "site" && normalizedType !== "site") return;
        }

        const eventDate = new Date(event.timeStart * 1000);
        const key = toKey(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        
        const colorIndex = event.color || (backendEvents.indexOf(event) % EV_COLORS.length);
        const eventItem = {
          ...event,
          id: event.id,
          label: event.name || event.title || event.label || "Événement",
          color: colorIndex,
          type: normalizedType,
          description: event.description
        };

        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(eventItem);
      }
    });

    return grouped;
  }, [backendEvents, filterType]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const goToPrevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const goToPrevYear = () => { setYear(y => y - 1); setSelectedDay(null); };
  const goToNextYear = () => { setYear(y => y + 1); setSelectedDay(null); };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  // ── Sélecteurs rapides ────────────────────────────────────────────────────

  const handleMonthSelect = (e) => {
    setMonth(Number(e.target.value));
    setSelectedDay(null);
  };

  const handleYearInput = (e) => {
    const v = Number(e.target.value);
    if (v > 1900 && v < 2200) { setYear(v); setSelectedDay(null); }
  };

  // ── Calcul de la grille ───────────────────────────────────────────────────

  const totalDays = daysInMonth(year, month);
  const offset    = firstDayOffset(year, month);

  const cells = useMemo(() => {
    const arr = [
      ...Array(offset).fill(null),
      ...Array.from({ length: totalDays }, (_, i) => i + 1),
    ];
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month, totalDays, offset]);

  const isToday = (d) =>
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const selectedKey    = selectedDay ? toKey(year, month, selectedDay) : null;
  const selectedEvents = selectedKey ? (calendarEvents[selectedKey] || []) : [];

  const handleOpenDialog = () => {
    let initialDate = "";
    if (selectedDay) {
      initialDate = toKey(year, month, selectedDay);
    } else {
      const d = new Date();
      initialDate = toKey(d.getFullYear(), d.getMonth(), d.getDate());
    }
    setFormData({
      name: "",
      description: "",
      date: initialDate,
      time: "08:00",
      eventType: "user",
      courseId: ""
    });
    setEditingEventId(null);
    setSubmitError(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setSubmitError("Le nom de l'événement est requis.");
      return;
    }
    if (!formData.date || !formData.time) {
      setSubmitError("La date et l'heure sont requises.");
      return;
    }
    if (formData.eventType === "course" && !formData.courseId) {
      setSubmitError("Veuillez sélectionner un cours.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      // Convertir la date et l'heure en timestamp Unix
      const dateTimeStr = `${formData.date}T${formData.time}`;
      const localDate = new Date(dateTimeStr);
      if (isNaN(localDate.getTime())) {
        throw new Error("Date ou heure invalide.");
      }
      const timeStart = Math.floor(localDate.getTime() / 1000);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        timeStart,
        timeDuration: 0,
        eventType: formData.eventType,
        courseId: formData.eventType === "course" ? Number(formData.courseId) : undefined
      };

      if (editingEventId) {
        await updateEvent(editingEventId, payload);
      } else {
        await createEvent(payload);
      }

      setIsDialogOpen(false);
      setEditingEventId(null);
      if (onEditEventClose) {
        onEditEventClose();
      }
      if (onEventCreated) {
        onEventCreated();
      }
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de l'événement:", err);
      setSubmitError(err.message || "Erreur lors de l'enregistrement de l'événement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 font-sans">

      {/* ── Barre du haut ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2.5">
        <h2 className="text-lg font-bold text-slate-800">Calendrier</h2>
        
        <div className="flex items-center gap-2">
          {/* Dropdown de filtrage */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[185px] bg-white text-slate-800 border-gray-200">
              <SelectValue placeholder="Tous les événements" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-sm text-slate-800">
              <SelectItem value="tous">Tous les événements</SelectItem>
              <SelectItem value="cours">Cours</SelectItem>
              <SelectItem value="utilisateur">Utilisateur</SelectItem>
              <SelectItem value="site">Site</SelectItem>
            </SelectContent>
          </Select>

          {/* Bouton Créer événement */}
          <Button 
            onClick={handleOpenDialog} 
            className="bg-primary text-white hover:bg-primary/95 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvel événement
          </Button>
        </div>
      </div>

      {/* ── Contrôles de navigation ── */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">

        {/* Navigation année */}
        <div className="flex items-center gap-1">
          <NavBtn onClick={goToPrevYear} title="Année précédente">«</NavBtn>
          <input
            type="number"
            value={year}
            onChange={handleYearInput}
            className="w-20 text-center p-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-slate-800 outline-none"
          />
          <NavBtn onClick={goToNextYear} title="Année suivante">»</NavBtn>
        </div>

        {/* Navigation mois */}
        <div className="flex items-center gap-1 flex-1 justify-center">
          <NavBtn onClick={goToPrevMonth} title="Mois précédent">‹</NavBtn>
          <select
            value={month}
            onChange={handleMonthSelect}
            className="px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-slate-800 outline-none cursor-pointer min-w-[110px] text-center"
          >
            {MONTH_NAMES.map((n, i) => (
              <option key={i} value={i}>{n}</option>
            ))}
          </select>
          <NavBtn onClick={goToNextMonth} title="Mois suivant">›</NavBtn>
        </div>
      </div>

      {/* ── Grille calendrier ── */}
      <div className="grid grid-cols-7 gap-0.5">

        {/* En-têtes des jours */}
        {DAY_NAMES_SHORT.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 pb-2">
            {d}
          </div>
        ))}

        {/* Cellules */}
        {cells.map((day, idx) => {
          const key = day ? toKey(year, month, day) : null;
          return (
            <DayCell
              key={idx}
              day={day}
              events={key ? (calendarEvents[key] || []) : []}
              isToday={day ? isToday(day) : false}
              isSelected={day !== null && day === selectedDay}
              onClick={() => {
                if (!day) return;
                setSelectedDay(prev => (prev === day ? null : day));
              }}
              onEventClick={onEventClick}
            />
          );
        })}
      </div>

      {/* ── Modal de création d'événement ── */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingEventId(null);
          if (onEditEventClose) {
            onEditEventClose();
          }
        }
      }}>
        <DialogContent className="sm:max-w-[425px] bg-white text-slate-800 border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              {editingEventId 
                ? (isReadOnly ? "Détails de l'événement" : "Modifier l'événement personnel")
                : "Créer un nouvel événement"
              }
            </DialogTitle>
            {isReadOnly && (
              <div className="mt-2 rounded-md bg-blue-50 border border-blue-100 p-2.5 text-xs font-medium text-blue-700">
                Cet événement provient de Moodle et ne peut pas être modifié.
              </div>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {submitError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 shadow-xs">
                {submitError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                Titre de l'événement <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: Révision d'examen"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isReadOnly}
                className="w-full bg-white text-slate-800 border-slate-200 focus:border-primary focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Détails supplémentaires..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isReadOnly}
                className="w-full bg-white text-slate-800 border-slate-200 focus:border-primary focus:ring-primary min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium text-slate-700">
                  Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  disabled={isReadOnly}
                  className="w-full bg-white text-slate-800 border-slate-200 focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-sm font-medium text-slate-700">
                  Heure <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                  disabled={isReadOnly}
                  className="w-full bg-white text-slate-800 border-slate-200 focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventType" className="text-sm font-medium text-slate-700">
                Type d'événement
              </Label>
              <Select
                value={formData.eventType}
                onValueChange={(val) => setFormData({ ...formData, eventType: val, courseId: "" })}
                disabled={isReadOnly}
              >
                <SelectTrigger className="w-full bg-white text-slate-800 border-slate-200" disabled={isReadOnly}>
                  <SelectValue placeholder="Utilisateur" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-sm text-slate-800">
                  <SelectItem value="user">Utilisateur (personnel)</SelectItem>
                  <SelectItem value="course">Cours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.eventType === "course" && (
              <div className="space-y-2">
                <Label htmlFor="courseId" className="text-sm font-medium text-slate-700">
                  Sélectionner le cours <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={formData.courseId}
                  onValueChange={(val) => setFormData({ ...formData, courseId: val })}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="w-full bg-white text-slate-800 border-slate-200" disabled={isReadOnly}>
                    <SelectValue placeholder="Choisir un cours" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-sm text-slate-800">
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={String(course.id)}>
                        {course.title || course.fullname || "Cours sans titre"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingEventId(null);
                  if (onEditEventClose) {
                    onEditEventClose();
                  }
                }}
                disabled={submitting}
                className="bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
              >
                {isReadOnly ? "Fermer" : "Annuler"}
              </Button>
              {!isReadOnly && (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-white hover:bg-primary/95 shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      Enregistrement...
                    </>
                  ) : (
                    editingEventId ? "Enregistrer" : "Créer l'événement"
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}