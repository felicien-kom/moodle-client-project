import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, CheckCircle2 } from "lucide-react";
import { FileUploadZone } from "@/components/upload/FileUploadZone";
import { CreateCourse } from "@/services/courses.service";

/**
 * Formulaire pour créer/éditer un cours
 * Réutilisable pour création ET édition
 */
export function CourseForm({ initialData, onSubmit, isLoading: propIsLoading, isEditing = false }) {
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const isLoading = propIsLoading || localIsLoading;
  const [formData, setFormData] = useState(
    initialData || {
      title: "",
      description: "",
      category: "",
      image: null,
      startDate: "",
      endDate: "",
    }
  );

  const [errors, setErrors] = useState({});

  // --- Validation ---
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est requis";
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = "La date de fin doit être après la date de début";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
    } else {
      setLocalIsLoading(true);
      try {
        await CreateCourse(formData);
        alert("Cours créé avec succès !");
        window.history.back();
      } catch (error) {
        console.error("Erreur lors de la création du cours:", error);
        alert("Erreur lors de la création du cours.");
      } finally {
        setLocalIsLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Upload d'image (Zone stylisée) */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-indigo-900">
          Image de couverture
        </label>
        <FileUploadZone
          accept="image/*"
          title="Cliquez ou glissez pour importer une image"
          hint="PNG, JPG ou WEBP (Max. 5 Mo)"
          onFilesSelected={(files) => {
            const file = files[0];
            if (file) {
              setFormData((prev) => ({ ...prev, image: file }));
            }
          }}
          className={formData.image ? "border-indigo-600 bg-indigo-50/50" : ""}
        >
          {formData.image ? (
            <div className="flex items-center justify-center gap-3 text-indigo-900 font-medium">
              <CheckCircle2 className="w-6 h-6 text-indigo-600" />
              <span>{formData.image.name || "Image sélectionnée"}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-500">
              <div className="w-12 h-12 mb-3 rounded-full bg-white shadow-[0_2px_8px_rgb(0,0,0,0.05)] border border-slate-100 flex items-center justify-center text-slate-400">
                <ImagePlus className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">Cliquez ou glissez pour importer une image</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG ou WEBP (Max. 5Mo)</p>
            </div>
          )}
        </FileUploadZone>
      </div>

      <div className="space-y-6">
        {/* Titre */}
        <div className="group">
          <label htmlFor="title" className="block text-sm font-semibold text-indigo-900 mb-2">
            Nom du cours <span className="text-red-500">*</span>
          </label>
          <Input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Ex: Architecture logicielle avancée"
            className={`w-full px-4 py-3 bg-slate-50 border ${errors.title ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:bg-white focus:border-indigo-900 focus:ring-indigo-900/20"} rounded-xl transition-all shadow-sm outline-none font-medium placeholder:font-normal placeholder:text-slate-400`}
          />
          {errors.title && <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.title}</p>}
        </div>

        {/* Catégorie */}
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-indigo-900 mb-2">
            Domaine & Catégorie
          </label>
          <div className="relative">
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-900 focus:ring-2 focus:ring-indigo-900/20 transition-all shadow-sm appearance-none font-medium text-slate-900"
            >
              <option value="" className="text-slate-400">Choisir une catégorie...</option>
              <option value="Developpement">Développement logiciel</option>
              <option value="Design">Design & UI/UX</option>
              <option value="Data Science">Data Science</option>
              <option value="Marketing">Marketing Digital</option>
              <option value="Business">Management & Business</option>
            </select>
            {/* Custom arrow for select */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>
        </div>

        {/* Description / Résumé */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-indigo-900 mb-2">
            Description détaillée <span className="text-slate-400 font-normal ml-1">(Optionnel)</span>
          </label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Ce cours permettra aux étudiants de..."
            rows={5}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-900 focus:ring-2 focus:ring-indigo-900/20 transition-all shadow-sm resize-y placeholder:text-slate-400"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-semibold text-indigo-900 mb-2">
              Lancement prévu <span className="text-slate-400 font-normal ml-1">(Optionnel)</span>
            </label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-900 focus:ring-2 focus:ring-indigo-900/20 transition-all shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-semibold text-indigo-900 mb-2">
              Clôture estimée <span className="text-slate-400 font-normal ml-1">(Optionnel)</span>
            </label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-slate-50 border ${errors.endDate ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:bg-white focus:border-indigo-900 focus:ring-indigo-900/20"} rounded-xl transition-all shadow-sm outline-none`}
            />
            {errors.endDate && <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.endDate}</p>}
          </div>
        </div>
      </div>

      {/* Boutons d'action en bas */}
      <div className="flex flex-col sm:flex-row gap-4 pt-8 mt-4 border-t border-indigo-100">
        <button 
          type="button" 
          onClick={() => window.history.back()}
          className="order-2 sm:order-1 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 transition-all shadow-sm w-full sm:w-auto"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="order-1 sm:order-2 px-8 py-3.5 bg-indigo-900 text-white font-semibold rounded-xl hover:bg-indigo-800 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:ring-2 focus:ring-indigo-900/40 ring-offset-2 disabled:opacity-70 disabled:hover:translate-y-0 w-full flex-1 flex justify-center items-center"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : isEditing ? (
            "Enregistrer les modifications"
          ) : (
            "Publier ce nouveau cours"
          )}
        </button>
      </div>
    </form>
  );
}
