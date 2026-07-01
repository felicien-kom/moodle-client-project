import { useState, useEffect } from "react";

// ─── Palette couleurs par type ────────────────────────────
const TYPE_STYLES = {
  cours:      { bg: "bg-green-100",  text: "text-green-800",  label: "Cours"      },
  utilisateur:{ bg: "bg-yellow-100", text: "text-yellow-800", label: "Utilisateur" },
  site:       { bg: "bg-blue-100",   text: "text-blue-800",   label: "Site"       },
  categorie:  { bg: "bg-purple-100", text: "text-purple-800", label: "Catégorie"  },
};

// ════════════════════════════════════════════════════════════
//  COMPOSANT EventModal
//
//  Props :
//    mode          "add" | "edit"
//    defaultDate   string  — date ISO pré-remplie (ex: "2026-01-14"), optionnel
//    initialData   { date, label, type } — données pré-remplies en mode edit
//    onClose       () => void
//    onSubmit      ({ date, label, type }) => void
// ════════════════════════════════════════════════════════════
export default function EventModal({
  mode = "add",
  defaultDate = "",
  initialData = null,
  onClose,
  onSubmit,
}) {
  const [date,  setDate]  = useState(initialData?.date  ?? defaultDate);
  const [label, setLabel] = useState(initialData?.label ?? "");
  const [type,  setType]  = useState(initialData?.type  ?? "");

  // Resync si initialData change (ex: réutilisation du composant)
  useEffect(() => {
    setDate(initialData?.date   ?? defaultDate);
    setLabel(initialData?.label ?? "");
    setType(initialData?.type   ?? "");
  }, [initialData, defaultDate]);

  const isValid = label.trim() !== "" && date !== "";

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({ date, label: label.trim(), type });
    onClose();
  };

  const preview = type ? TYPE_STYLES[type] : null;

  return (
    /* ── Overlay — clic en dehors = fermer ── */
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center"
    >
      {/* ── Carte modale ── */}
      <div className="bg-white rounded-xl w-80 border border-gray-200 overflow-hidden">

        {/* En-tête bleu sombre */}
        <div className=" px-5 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            {mode === "add" ? "Nouvel événement" : "Modifier l'événement"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Corps */}
        <div className="px-5 py-5 space-y-3">

          {/* ── Champ Date ── */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50
                         text-xs text-gray-700 outline-none
                         focus:border-[#1e3a5f] focus:bg-white transition-colors"
            />
          </div>

          {/* ── Champ Titre ── */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Titre
            </label>
            <input
              type="text"
              placeholder="Ex : TD Physique, Examen…"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50
                         text-xs text-gray-700 outline-none
                         focus:border-[#1e3a5f] focus:bg-white transition-colors"
            />
          </div>

          {/* ── Champ Type ── */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50
                         text-xs text-gray-700 outline-none cursor-pointer
                         focus:border-[#1e3a5f] focus:bg-white transition-colors"
            >
              <option value="">Choisir un type</option>
              <option value="cours">Cours</option>
              <option value="utilisateur">Utilisateur</option>
              <option value="site">Site</option>
              <option value="categorie">Catégorie</option>
            </select>
          </div>
    
          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white
                         text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid}
              className={`px-4 py-2 rounded-lg text-xs text-white font-medium
                          bg-[#1e3a5f] hover:bg-[#162d4a] transition-colors cursor-pointer
                          ${!isValid ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {mode === "add" ? "Ajouter" : "Modifier"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}