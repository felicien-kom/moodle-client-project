import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Upload } from "lucide-react";
import { createLocalCourse } from "@/services/courses.service";

const CATEGORIES = ["Catégorie 1", "Catégorie 2", "Catégorie 3", "Mathématiques", "Informatique"];
const VISIBILITE = ["Afficher", "Masquer"];

// ─── Configuration des dimensions de la modal ────────────────────────────────
// Pour ajuster la largeur : modifier la valeur max-w-10xl dans DialogContent (ligne 46)
// Options de largeur : max-w-sm, max-w-md, max-w-lg, max-w-xl, max-w-2xl, max-w-3xl, max-w-4xl, max-w-5xl, max-w-6xl, max-w-7xl
// Pour ajuster la hauteur : modifier max-h-[90vh] dans DialogContent (ligne 46)
// Pour ajuster le padding horizontal : modifier px-6 dans DialogHeader et div (lignes 47, 51)

export default function CreateCourseModal({ open, onOpenChange, onCourseCreated }) {
  const [form, setForm] = useState({
    nomComplet: "",
    nomAbrege: "",
    categories: ["Catégorie 1"],
    visibilite: "Afficher",
    dateDebut: { jour: "28", mois: "mai", annee: "2026", hh: "00", mm: "00" },
    dateFin: { actif: true, jour: "28", mois: "mai", annee: "2027", hh: "00", mm: "00" },
    numeroId: "",
    resume: "",
    image: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const removeCategorie = (cat) =>
    setForm((f) => ({ ...f, categories: f.categories.filter((c) => c !== cat) }));

  const addCategorie = (cat) => {
    if (!form.categories.includes(cat))
      setForm((f) => ({ ...f, categories: [...f.categories, cat] }));
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const MOIS = ["jan","fév","mar","avr","mai","juin","juil","août","sep","oct","nov","déc"];

  const handleSubmit = async () => {
    if (!form.nomComplet.trim()) {
      alert("Le nom complet du cours est requis");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createLocalCourse(form);
      
      // Appeler la callback pour ajouter le cours à la liste
      if (onCourseCreated && result.course) {
        onCourseCreated(result.course);
      }
      
      // Fermer la modal et réinitialiser le formulaire
      onOpenChange(false);
      setForm({
        nomComplet: "",
        nomAbrege: "",
        categories: ["Catégorie 1"],
        visibilite: "Afficher",
        dateDebut: { jour: "28", mois: "mai", annee: "2026", hh: "00", mm: "00" },
        dateFin: { actif: true, jour: "28", mois: "mai", annee: "2027", hh: "00", mm: "00" },
        numeroId: "",
        resume: "",
        image: null,
      });
      
      alert("Cours créé avec succès !");
    } catch (error) {
      console.error("Erreur lors de la création du cours:", error);
      // Si l'endpoint n'existe pas encore, simuler la création localement
      if (error.message && error.message.includes("404") || error.message && error.message.includes("405")) {
        const simulatedCourse = {
          id: Date.now(),
          title: form.nomComplet,
          shortName: form.nomAbrege || form.nomComplet.substring(0, 10),
          categoryName: form.categories[0] || "Non catégorisé",
          summary: form.resume || "",
          imageUrl: null,
          startDate: form.dateDebut ? new Date(form.dateDebut.annee, getMonthIndex(form.dateDebut.mois), parseInt(form.dateDebut.jour)).getTime() / 1000 : null,
          endDate: form.dateFin && form.dateFin.actif ? new Date(form.dateFin.annee, getMonthIndex(form.dateFin.mois), parseInt(form.dateFin.jour)).getTime() / 1000 : null,
          visible: form.visibilite === "Afficher",
        };
        
        if (onCourseCreated) {
          onCourseCreated(simulatedCourse);
        }
        
        onOpenChange(false);
        setForm({
          nomComplet: "",
          nomAbrege: "",
          categories: ["Catégorie 1"],
          visibilite: "Afficher",
          dateDebut: { jour: "28", mois: "mai", annee: "2026", hh: "00", mm: "00" },
          dateFin: { actif: true, jour: "28", mois: "mai", annee: "2027", hh: "00", mm: "00" },
          numeroId: "",
          resume: "",
          image: null,
        });
        
        alert("Cours créé localement (endpoint non disponible)");
      } else {
        alert("Erreur lors de la création du cours: " + (error.message || error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  function getMonthIndex(monthName) {
    const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
    return months.indexOf(monthName.toLowerCase());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-10xl w-full max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">Créer un nouveau cours</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">

          {/* Informations générales */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              Informations générales
            </h3>
            <div className="space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                <Label className="sm:pt-2 text-sm font-medium">
                  Nom complet du cours <span className="text-red-500">*</span>
                </Label>
                <div className="sm:col-span-2">
                  <Input
                    value={form.nomComplet}
                    onChange={(e) => set("nomComplet", e.target.value)}
                    placeholder="Ex. : Introduction à l'algèbre"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                <Label className="sm:pt-2 text-sm font-medium">Nom abrégé du cours</Label>
                <div className="sm:col-span-2">
                  <Input
                    value={form.nomAbrege}
                    onChange={(e) => set("nomAbrege", e.target.value)}
                    placeholder="Ex. : ALGO101"
                    className="w-full"
                  />
                </div>
              </div>

              

              
              

              {/* Date début */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <Label className="text-sm font-medium">Date de début du cours</Label>
                <div className="sm:col-span-2 flex flex-wrap gap-1 items-center">
                  {["jour","mois","annee","hh","mm"].map((k) => (
                    k === "mois" ? (
                      <Select key={k} value={form.dateDebut.mois}
                        onValueChange={(v) => set("dateDebut", { ...form.dateDebut, mois: v })}>
                        <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{MOIS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input key={k} value={form.dateDebut[k]}
                        onChange={(e) => set("dateDebut", { ...form.dateDebut, [k]: e.target.value })}
                        className="w-14 h-8 text-xs text-center px-1" />
                    )
                  ))}
                </div>
              </div>

              {/* Date fin */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <Label className="text-sm font-medium">Date de fin du cours</Label>
                <div className="sm:col-span-2 flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.dateFin.actif}
                      onCheckedChange={(v) => set("dateFin", { ...form.dateFin, actif: v })}
                    />
                    <span className="text-xs text-gray-500">Activer</span>
                  </div>
                  {form.dateFin.actif && ["jour","mois","annee","hh","mm"].map((k) => (
                    k === "mois" ? (
                      <Select key={k} value={form.dateFin.mois}
                        onValueChange={(v) => set("dateFin", { ...form.dateFin, mois: v })}>
                        <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{MOIS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input key={k} value={form.dateFin[k]}
                        onChange={(e) => set("dateFin", { ...form.dateFin, [k]: e.target.value })}
                        className="w-14 h-8 text-xs text-center px-1" />
                    )
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Description */}
          <section>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              Description
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                <Label className="sm:pt-2 text-sm font-medium">Résumé du cours</Label>
                <div className="sm:col-span-2">
                  <Textarea
                    value={form.resume}
                    onChange={(e) => set("resume", e.target.value)}
                    placeholder="Décrivez brièvement ce cours..."
                    rows={4}
                    className="w-full resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
                <Label className="sm:pt-2 text-sm font-medium">Image de cours</Label>
                <div className="sm:col-span-2">
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Upload size={22} className="text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">
                      {form.image ? form.image.name : "Glissez un fichier ou cliquez pour en choisir un"}
                    </span>
                    <span className="text-[11px] text-gray-400 mt-0.5">
                      JPG, JPEG, PNG, GIF, SVG acceptés
                    </span>
                    <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.gif,.svg"
                      onChange={(e) => set("image", e.target.files?.[0] ?? null)} />
                  </label>
                </div>
              </div>
            </div>
          </section>
        </div>

        <DialogFooter className="px-6 py-4 border-t flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto" disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
            {isSubmitting ? "Création..." : "Créer le cours"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}