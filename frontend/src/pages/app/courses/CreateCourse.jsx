import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCourse, addSection, addActivity } from "@/services/courses.service";
import { useAuth } from "@/hooks/useAuth";
import { PATHS } from "@/router/paths";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  BookOpen,
  Settings,
  LayoutList,
  ImagePlus,
  Plus,
  Trash2,
  Video,
  FileText,
  CheckCircle2,
  HelpCircle,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Upload,
  Globe,
  Lock,
} from "lucide-react";

// ---- Étapes du Studio ----
const STEPS = [
  { id: 1, label: "Informations",  icon: BookOpen,     description: "Titre, description, catégorie et image" },
  { id: 2, label: "Programme",     icon: LayoutList,   description: "Sections et ressources du cours" },
  { id: 3, label: "Paramètres",    icon: Settings,     description: "Visibilité et configuration" },
];

const CATEGORIES = [
  "Developpement", "Design", "Data Science",
  "Architecture",  "Education", "Business", "Marketing",
];

const LEVELS = ["Débutant", "Intermédiaire", "Avancé"];

const ACTIVITY_TYPES = [
  { value: "video",    label: "Vidéo",     icon: Video },
  { value: "resource", label: "Ressource", icon: FileText },
  { value: "task",     label: "Exercice",  icon: CheckCircle2 },
  { value: "quiz",     label: "Quiz",      icon: HelpCircle },
];

// ---- Étape 1 : Informations de base ----
function StepInfo({ data, onChange, errors }) {
  const [preview, setPreview] = useState(data.imagePreview || null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange({ image: file, imagePreview: url });
  };

  return (
    <div className="space-y-7">
      {/* Image de couverture */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-2">Image de couverture</label>
        <div
          className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden cursor-pointer hover:border-slate-400 hover:bg-slate-100 transition-all duration-200 group"
          onClick={() => document.getElementById("course-image-input").click()}
          style={{ aspectRatio: "16/7" }}
        >
          <input
            id="course-image-input"
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          {preview ? (
            <>
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex items-center gap-2 bg-white text-slate-800 text-sm font-semibold px-4 py-2 rounded-full">
                  <Upload className="h-4 w-4" />
                  Changer l'image
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
              <div className="h-14 w-14 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
                <ImagePlus className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold">Cliquez pour importer une image</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG ou WEBP — max 5 Mo — 16:9 recommandé</p>
            </div>
          )}
        </div>
      </div>

      {/* Titre */}
      <div>
        <label htmlFor="course-title" className="block text-sm font-semibold text-slate-800 mb-2">
          Titre du cours <span className="text-red-500">*</span>
        </label>
        <input
          id="course-title"
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Ex. : Maîtriser l'architecture web moderne"
          className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 ${
            errors.title
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
          }`}
        />
        {errors.title && <p className="text-red-500 text-xs mt-1.5">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Catégorie */}
        <div>
          <label htmlFor="course-category" className="block text-sm font-semibold text-slate-800 mb-2">
            Catégorie
          </label>
          <div className="relative">
            <select
              id="course-category"
              value={data.category}
              onChange={(e) => onChange({ category: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 appearance-none focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition bg-white"
            >
              <option value="">Choisir une catégorie</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Niveau */}
        <div>
          <label htmlFor="course-level" className="block text-sm font-semibold text-slate-800 mb-2">
            Niveau requis
          </label>
          <div className="relative">
            <select
              id="course-level"
              value={data.level}
              onChange={(e) => onChange({ level: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 appearance-none focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition bg-white"
            >
              <option value="">Tous niveaux</option>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="course-desc" className="block text-sm font-semibold text-slate-800 mb-2">
          Description détaillée
        </label>
        <textarea
          id="course-desc"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Décrivez ce que les apprenants vont maîtriser à la fin de cette formation..."
          rows={5}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition resize-none"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="start-date" className="block text-sm font-semibold text-slate-800 mb-2">
            Date de début <span className="text-slate-400 font-normal">(Optionnel)</span>
          </label>
          <input
            id="start-date"
            type="date"
            value={data.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-semibold text-slate-800 mb-2">
            Date de fin <span className="text-slate-400 font-normal">(Optionnel)</span>
          </label>
          <input
            id="end-date"
            type="date"
            value={data.endDate}
            onChange={(e) => onChange({ endDate: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
          />
        </div>
      </div>
    </div>
  );
}

// ---- Étape 2 : Constructeur de programme ----
function StepCurriculum({ sections, onAddSection, onRemoveSection, onAddActivity, onRemoveActivity }) {
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [expandedSections, setExpandedSections] = useState({});
  const [addingActivityFor, setAddingActivityFor] = useState(null);
  const [newActivity, setNewActivity] = useState({ title: "", type: "video", duration: "" });

  const toggle = (id) => setExpandedSections((p) => ({ ...p, [id]: !p[id] }));

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    onAddSection(newSectionTitle);
    setNewSectionTitle("");
  };

  const handleAddActivity = (sectionId) => {
    if (!newActivity.title.trim()) return;
    onAddActivity(sectionId, { ...newActivity, id: `tmp-${Date.now()}` });
    setNewActivity({ title: "", type: "video", duration: "" });
    setAddingActivityFor(null);
  };

  return (
    <div className="space-y-5">
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <p className="text-sm text-slate-600 leading-relaxed">
          Structurez votre formation en sections thématiques. Ajoutez ensuite des ressources (vidéos, documents, exercices ou quiz) dans chaque section.
        </p>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 bg-white">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 mx-auto mb-4 flex items-center justify-center">
            <LayoutList className="h-7 w-7 text-slate-400" strokeWidth={1.5} />
          </div>
          <p className="text-slate-600 font-medium mb-1">Aucune section pour le moment</p>
          <p className="text-slate-400 text-sm">Ajoutez votre première section ci-dessous.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <div key={section.id || idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 p-4">
                <GripVertical className="h-4 w-4 text-slate-300 cursor-grab flex-shrink-0" />
                <div
                  className="flex-1 flex items-center gap-3 cursor-pointer"
                  onClick={() => toggle(section.id || idx)}
                >
                  <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{section.title}</p>
                  <span className="text-xs text-slate-400 ml-auto">
                    {section.activities?.length || 0} ressource{(section.activities?.length || 0) !== 1 ? "s" : ""}
                  </span>
                  {expandedSections[section.id || idx]
                    ? <ChevronUp className="h-4 w-4 text-slate-400" />
                    : <ChevronDown className="h-4 w-4 text-slate-400" />
                  }
                </div>
                <button
                  onClick={() => onRemoveSection(section.id || idx)}
                  className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Activités */}
              {expandedSections[section.id || idx] && (
                <div className="border-t border-slate-100 p-4 space-y-2">
                  {section.activities?.map((act, aIdx) => {
                    const config = ACTIVITY_TYPES.find((t) => t.value === act.type) || ACTIVITY_TYPES[0];
                    const AIcon = config.icon;
                    return (
                      <div key={act.id || aIdx} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 group/act">
                        <AIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span className="flex-1 text-sm text-slate-700">{act.title}</span>
                        {act.duration && <span className="text-xs text-slate-400">{act.duration}</span>}
                        <button
                          onClick={() => onRemoveActivity(section.id || idx, act.id || aIdx)}
                          className="opacity-0 group-hover/act:opacity-100 flex items-center justify-center h-6 w-6 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}

                  {addingActivityFor === (section.id || idx) ? (
                    <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      {/* Types */}
                      <div className="flex flex-wrap gap-1.5">
                        {ACTIVITY_TYPES.map((t) => {
                          const TIcon = t.icon;
                          return (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setNewActivity((p) => ({ ...p, type: t.value }))}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                                newActivity.type === t.value ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                              }`}
                            >
                              <TIcon className="h-3 w-3" /> {t.label}
                            </button>
                          );
                        })}
                      </div>
                      <input
                        type="text"
                        value={newActivity.title}
                        onChange={(e) => setNewActivity((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Titre de la ressource..."
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-slate-400 transition"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleAddActivity(section.id || idx)}
                      />
                      <input
                        type="text"
                        value={newActivity.duration}
                        onChange={(e) => setNewActivity((p) => ({ ...p, duration: e.target.value }))}
                        placeholder="Durée estimée (ex : 20 min)"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-slate-400 transition"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleAddActivity(section.id || idx)} disabled={!newActivity.title.trim()} className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50 hover:bg-slate-700 transition">Ajouter</button>
                        <button onClick={() => { setAddingActivityFor(null); setNewActivity({ title: "", type: "video", duration: "" }); }} className="border border-slate-200 bg-white text-slate-600 px-4 py-1.5 rounded-xl text-xs font-medium hover:bg-slate-50 transition">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingActivityFor(section.id || idx)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition border border-dashed border-slate-200 mt-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Ajouter une ressource
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ajouter section */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          placeholder="Titre de la nouvelle section..."
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition"
          onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
        />
        <button
          onClick={handleAddSection}
          disabled={!newSectionTitle.trim()}
          className="flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Section
        </button>
      </div>
    </div>
  );
}

// ---- Étape 3 : Paramètres ----
function StepSettings({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <p className="text-sm text-slate-600">Configurez la visibilité et les paramètres avancés de ce cours.</p>
      </div>

      {/* Visibilité */}
      <div>
        <p className="text-sm font-semibold text-slate-800 mb-3">Visibilité du cours</p>
        <div className="space-y-2">
          {[
            { value: "public", label: "Public", sub: "Visible par tous les apprenants de la plateforme", icon: Globe },
            { value: "private", label: "Privé", sub: "Accessible uniquement sur invitation ou lien direct", icon: Lock },
          ].map((opt) => {
            const OIcon = opt.icon;
            return (
              <label
                key={opt.value}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition ${
                  data.visibility === opt.value ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={data.visibility === opt.value}
                  onChange={() => onChange({ visibility: opt.value })}
                  className="hidden"
                />
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 ${data.visibility === opt.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                  <OIcon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
                </div>
                {data.visibility === opt.value && (
                  <div className="h-5 w-5 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Prérequis */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-2">
          Prérequis <span className="text-slate-400 font-normal">(Optionnel)</span>
        </label>
        <textarea
          value={data.prerequisites}
          onChange={(e) => onChange({ prerequisites: e.target.value })}
          placeholder="Ex. : Connaissances de base en programmation, maîtrise de JavaScript..."
          rows={3}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition resize-none"
        />
      </div>

      {/* Aperçu résumé */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold text-slate-800">Résumé avant publication</p>
        <div className="space-y-1.5 text-sm text-slate-600">
          <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" />Titre et catégorie définis</p>
          <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" />Niveau d'accès configuré</p>
          <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" />Prêt à être publié</p>
        </div>
      </div>
    </div>
  );
}

// ---- Page principale CreateCourse ----
function CreateCourse() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [courseInfo, setCourseInfo] = useState({
    title: "", description: "", category: "", level: "",
    startDate: "", endDate: "", image: null, imagePreview: null,
  });

  const [sections, setSections] = useState([]);

  const [settings, setSettings] = useState({ visibility: "public", prerequisites: "" });

  const updateInfo = (patch) => setCourseInfo((p) => ({ ...p, ...patch }));
  const updateSettings = (patch) => setSettings((p) => ({ ...p, ...patch }));

  const handleAddSection = (title) => {
    setSections((p) => [...p, { id: `tmp-${Date.now()}`, title, activities: [] }]);
  };

  const handleRemoveSection = (idOrIdx) => {
    setSections((p) => p.filter((s, i) => s.id !== idOrIdx && i !== idOrIdx));
  };

  const handleAddActivity = (sectionIdOrIdx, activity) => {
    setSections((p) =>
      p.map((s, i) =>
        s.id === sectionIdOrIdx || i === sectionIdOrIdx
          ? { ...s, activities: [...(s.activities || []), activity] }
          : s
      )
    );
  };

  const handleRemoveActivity = (sectionIdOrIdx, actIdOrIdx) => {
    setSections((p) =>
      p.map((s, i) =>
        s.id === sectionIdOrIdx || i === sectionIdOrIdx
          ? { ...s, activities: (s.activities || []).filter((a, ai) => a.id !== actIdOrIdx && ai !== actIdOrIdx) }
          : s
      )
    );
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!courseInfo.title.trim()) newErrors.title = "Le titre est requis.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    setCurrentStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep1()) { setCurrentStep(1); return; }
    try {
      setIsLoading(true);
      const created = await createCourse({
        ...courseInfo,
        ...settings,
        createdBy: user?.id,
        createdByName: user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Inconnu",
      });

      // Ajout des sections localement
      for (const section of sections) {
        await addSection(created.id, { title: section.title });
      }

      navigate(PATHS.app.courses.list, { state: { message: "Cours créé avec succès !" } });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f4f6f9]">
      {/* ===== HEADER ===== */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(PATHS.app.courses.list)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Annuler
          </button>

          {/* Stepper */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-2">
                <button
                  onClick={() => { if (step.id < currentStep || (step.id === currentStep + 1 && validateStep1())) setCurrentStep(step.id); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    currentStep === step.id
                      ? "bg-slate-900 text-white"
                      : currentStep > step.id
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <step.icon className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
                {idx < STEPS.length - 1 && <div className="w-6 h-px bg-slate-200 hidden sm:block" />}
              </div>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-medium hidden md:block">
            Étape {currentStep} sur {STEPS.length}
          </div>
        </div>
      </div>

      {/* ===== CONTENU ===== */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
        {/* Titre de la section */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">
            {STEPS[currentStep - 1].label}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{STEPS[currentStep - 1].description}</p>
        </div>

        {/* Étape 1 */}
        {currentStep === 1 && (
          <StepInfo data={courseInfo} onChange={updateInfo} errors={errors} />
        )}

        {/* Étape 2 */}
        {currentStep === 2 && (
          <StepCurriculum
            sections={sections}
            onAddSection={handleAddSection}
            onRemoveSection={handleRemoveSection}
            onAddActivity={handleAddActivity}
            onRemoveActivity={handleRemoveActivity}
          />
        )}

        {/* Étape 3 */}
        {currentStep === 3 && (
          <StepSettings data={settings} onChange={updateSettings} />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-200">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-600 border border-slate-200 bg-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" /> Précédent
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow-sm"
            >
              Suivant <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 bg-slate-900 text-white px-7 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow-sm disabled:opacity-70"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isLoading ? "Publication..." : "Publier le cours"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateCourse;
