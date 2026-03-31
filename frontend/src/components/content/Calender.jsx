import { useState, useMemo } from "react";
import EventModal from "./EventModal";

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
  { bg: "bg-indigo-100", text: "text-indigo-800" },
];

// Événements de démonstration — clé format "YYYY-MM-DD"
const INITIAL_EVENTS = {
  "2026-01-07": [{ id: 1,  label: "bonjour toud",   color: 0 }],
  "2026-01-09": [{ id: 2,  label: "en gfant q..",   color: 2 }],
  "2026-01-13": [{ id: 3,  label: "glog",           color: 1 }],
  "2026-01-14": [{ id: 4,  label: "TD 4 envoyer",   color: 1 }],
  "2026-01-15": [{ id: 5,  label: "nen n'est..",    color: 4 }],
  "2026-01-17": [{ id: 6,  label: "lmloutds",       color: 3 }, { id: 7, label: "jeudi les a..", color: 5 }],
  "2026-01-20": [{ id: 8,  label: "jxhjxhk",        color: 8 }],
  "2026-01-22": [{ id: 9,  label: "Physique..",      color: 6 }, { id: 10, label: "mimi", color: 7 }],
  "2026-01-23": [{ id: 11, label: "lseee",           color: 2 }, { id: 12, label: "jqftfhgkl..", color: 1 }],
  "2026-01-25": [{ id: 13, label: "lolita",          color: 6 }, { id: 14, label: "yo les gars", color: 4 }],
  "2026-01-26": [{ id: 15, label: "fermeture..",     color: 0 }, { id: 16, label: "vous éla t..", color: 1 }],
  "2026-01-27": [{ id: 17, label: "patate",          color: 2 }, { id: 18, label: "patate", color: 2 }],
  "2026-01-28": [{ id: 19, label: "patate",          color: 2 }, { id: 20, label: "Tamo Geo..", color: 5 }],
  "2026-01-29": [{ id: 21, label: "nogr",            color: 4 }, { id: 22, label: "De voir de..", color: 1 }],
  "2026-01-30": [{ id: 23, label: "ouverture",       color: 2 }, { id: 24, label: "fermeture", color: 0 }],
  "2026-02-03": [{ id: 25, label: "Physique",        color: 6 }],
  "2026-02-10": [{ id: 26, label: "Rendu projet",    color: 0 }],
  "2026-02-14": [{ id: 27, label: "Saint-Valentin",  color: 6 }],
  "2026-02-20": [{ id: 28, label: "Soutenance",      color: 3 }, { id: 29, label: "TD final", color: 1 }],
  "2026-02-25": [{ id: 30, label: "TP Réseau",       color: 8 }],
  "2026-03-01": [{ id: 31, label: "Début S2",        color: 2 }],
  "2026-03-15": [{ id: 32, label: "Exam mi-term",    color: 0 }],
  "2026-03-22": [{ id: 33, label: "glog avancé",     color: 1 }],
};

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
function EventPill({ ev }) {
  const c = EV_COLORS[ev.color % EV_COLORS.length];
  return (
    <div
      title={ev.label}
      className={`${c.bg} ${c.text} text-xs px-1.5 py-0.5 rounded-full truncate w-full mb-0.5 cursor-default font-medium`}
    >
      {ev.label}
    </div>
  );
}

/** Cellule d'un jour */
function DayCell({ day, events = [], isToday, isSelected, onClick }) {
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
                isSelected ? "text-blue-700" : "text-black"
              }`}>
                {day}
              </span>
            )}
          </div>
          {/* Événements (max 2 + compteur) */}
          <div>
            {events.slice(0, 2).map(ev => <EventPill key={ev.id} ev={ev} />)}
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

export default function Calender() {
  const today = new Date();

  // État navigation
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // État sélection / événements
  const [selectedDay, setSelectedDay] = useState(null);
  const [events, setEvents] = useState(INITIAL_EVENTS);

  // Modale
  const [modal, setModal] = useState(null); // null | { defaultDate: string }

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

  // ── Gestion événements ────────────────────────────────────────────────────

  const addEvent = ({ date, label, color }) => {
    setEvents(prev => ({
      ...prev,
      [date]: [...(prev[date] || []), { id: Date.now(), label, color }],
    }));
    // Synchroniser la vue sur le mois de l'événement ajouté
    const [y, m] = date.split("-").map(Number);
    setYear(y);
    setMonth(m - 1);
    setSelectedDay(Number(date.split("-")[2]));
  };

  const deleteEvent = (day, evId) => {
    const key = toKey(year, month, day);
    setEvents(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(e => e.id !== evId),
    }));
  };

  const handleEditEvent = ({ date, label, type }) => {
    // Pour l'instant, on ajoute un nouvel événement avec les données modifiées
    // Dans une version complète, il faudrait identifier l'événement à modifier
    setEvents(prev => ({
      ...prev,
      [date]: [...(prev[date] || []), { id: Date.now(), label, type }],
    }));
  };

  const selectedKey    = selectedDay ? toKey(year, month, selectedDay) : null;
  const selectedEvents = selectedKey ? (events[selectedKey] || []) : [];

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 font-sans">

      {/* ── Barre du haut ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2.5">
        <h2 className="text-lg font-bold text-black">Calendrier</h2>
        <div className="flex items-center gap-2">
          <select className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 outline-none cursor-pointer">
            <option value="">Choisir un type</option>
            <option value="cours">Cours</option>
            <option value="utilisateur">Utilisateur</option>
            <option value="site">Site</option>
            <option value="categorie">Catégorie</option>
          </select>

          <button
            onClick={() => setModal({ defaultDate: "" })}
            className="bg-slate-800 text-white border-none rounded-lg px-3 py-1.5 text-sm cursor-pointer font-medium flex items-center gap-1.5"
          >
            <span className="text-sm font-bold">+</span> Nouvel événement
          </button>
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
            className="w-20 text-center p-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 outline-none"
          />
          <NavBtn onClick={goToNextYear} title="Année suivante">»</NavBtn>
        </div>

        {/* Navigation mois */}
        <div className="flex items-center gap-1 flex-1 justify-center">
          <NavBtn onClick={goToPrevMonth} title="Mois précédent">‹</NavBtn>
          <select
            value={month}
            onChange={handleMonthSelect}
            className="px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-900 outline-none cursor-pointer min-w-[110px] text-center"
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
              events={key ? (events[key] || []) : []}
              isToday={day ? isToday(day) : false}
              isSelected={day !== null && day === selectedDay}
              onClick={() => {
                if (!day) return;
                const dayEvents = events[key] || [];
                setSelectedDay(prev => (prev === day ? null : day));
                
                // Si le jour a des événements, ouvrir la modal en mode edit avec le premier événement
                if (dayEvents.length > 0) {
                  const firstEvent = dayEvents[0];
                  setModal({
                    mode: "edit",
                    initialData: {
                      date: toKey(year, month, day),
                      label: firstEvent.label,
                      type: firstEvent.type || ("cours" in firstEvent ? "cours" : undefined)
                    }
                  });
                }
              }}
            />
          );
        })}
      </div>



      {/* ── Modal ajout/édition d'événement ── */}
      {modal && (
        <EventModal
          mode={modal.mode || "add"}
          defaultDate={modal.defaultDate}
          initialData={modal.initialData}
          onClose={() => setModal(null)}
          onSubmit={modal.mode === "edit" ? handleEditEvent : addEvent}
        />
      )}
    </div>
  );
}