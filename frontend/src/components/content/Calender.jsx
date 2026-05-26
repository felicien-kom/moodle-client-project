import { useState, useMemo } from "react";

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

export default function Calender({ events: backendEvents = [] }) {
  const today = new Date();

  // État navigation
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // État sélection
  const [selectedDay, setSelectedDay] = useState(null);

  // ─── Convertir les événements du backend en format calendrier ─────────────
  const calendarEvents = useMemo(() => {
    const grouped = {};

    // Convertir les événements du backend en format calendrier
    backendEvents.forEach(event => {
      if (event.timeStart) {
        const eventDate = new Date(event.timeStart * 1000);
        const key = toKey(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        
        const colorIndex = event.color || (backendEvents.indexOf(event) % EV_COLORS.length);
        const eventItem = {
          id: event.id,
          label: event.name || event.title || event.label || "Événement",
          color: colorIndex,
          type: event.eventType || event.type || "event",
          description: event.description
        };

        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(eventItem);
      }
    });

    return grouped;
  }, [backendEvents]);

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

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 font-sans">

      {/* ── Barre du haut ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2.5">
        <h2 className="text-lg font-bold text-black">Calendrier</h2>
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
              events={key ? (calendarEvents[key] || []) : []}
              isToday={day ? isToday(day) : false}
              isSelected={day !== null && day === selectedDay}
              onClick={() => {
                if (!day) return;
                setSelectedDay(prev => (prev === day ? null : day));
              }}
            />
          );
        })}
      </div>
    </div>
  );
}