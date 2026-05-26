import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
//import DetailDevoir from "./DetailDevoir";
//import DetailSoumission from "./DetailSoumission";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Calendar,
  FileText,
  User,
  CheckCircle,
} from "lucide-react";

// ─── Données mockées (alignées sur schema.prisma) ────────────────────────────
const devoirsData = [
  {
    id: 1,
    name: "Examen final",
    intro: "Examen final du cours Machine Learning. Durée : 2h. Couvre les chapitres 1 à 8.",
    dueDate: 1713590400, // 20/04/2026
    cutoffDate: 1713676800, // 21/04/2026
    allowedTypes: "file",
    maxFileSize: 10485760, // 10MB
    visible: true,
    courseId: 2,
    course: {
      title: "Machine Learning",
      shortName: "ML"
    },
    submissions: [
      {
        id: 1,
        submissionText: null,
        filePath: "/uploads/examen_alice.pdf",
        fileName: "examen_alice.pdf",
        state: "GRADED",
        grade: 16.0,
        gradedAt: 1713244800,
        feedback: "Très bon travail, bonne maîtrise des concepts.",
        studentName: "Alice Martin",
        studentInitials: "AM",
        submittedAt: 1713081600
      },
      {
        id: 2,
        submissionText: null,
        filePath: "/uploads/examen_bob.pdf",
        fileName: "examen_bob.pdf",
        state: "SUBMITTED",
        grade: null,
        gradedAt: null,
        feedback: null,
        studentName: "Bob Nguyen",
        studentInitials: "BN",
        submittedAt: 1713085200
      },
    ],
  },
  {
    id: 2,
    name: "TP Régression linéaire",
    intro: "Travail pratique sur la régression linéaire simple et multiple.",
    dueDate: 1713504000, // 15/04/2026
    cutoffDate: 1713590400, // 16/04/2026
    allowedTypes: "both",
    maxFileSize: 5242880, // 5MB
    visible: true,
    courseId: 3,
    course: {
      title: "Statistiques avancées",
      shortName: "STAT"
    },
    submissions: [
      {
        id: 3,
        submissionText: "Voici mon TP sur la régression linéaire.",
        filePath: "/uploads/tp_julie.pdf",
        fileName: "tp_julie.pdf",
        state: "GRADED",
        grade: 14.0,
        gradedAt: 1712918400,
        feedback: "Excellent travail, graphiques bien expliqués.",
        studentName: "Julie Dupont",
        studentInitials: "JD",
        submittedAt: 1712755200
      },
    ],
  },
  {
    id: 3,
    name: "Quizz — Réseaux de neurones",
    intro: "Quizz portant sur les architectures CNN, RNN et Transformer.",
    dueDate: 1713676800, // 18/04/2026
    cutoffDate: 1713763200, // 19/04/2026
    allowedTypes: "text",
    maxFileSize: 1048576, // 1MB
    visible: true,
    courseId: 4,
    course: {
      title: "Deep Learning",
      shortName: "DL"
    },
    submissions: [
      {
        id: 4,
        submissionText: "Réponses au quizz sur les réseaux de neurones.",
        filePath: "/uploads/quizz_brice.pdf",
        fileName: "quizz_brice.pdf",
        state: "GRADED",
        grade: 8.0,
        gradedAt: 1712572800,
        feedback: "Quelques erreurs sur la backpropagation.",
        studentName: "Brice Nguyen",
        studentInitials: "BN",
        submittedAt: 1712400000
      },
    ],
  },
];

// ─── Couleurs avatar ──────────────────────────────────────────────────────────
const avatarColors = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-pink-100", text: "text-pink-700" },
  { bg: "bg-green-100", text: "text-green-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
];
function getAvatarColor(initiales) {
  const idx = initiales.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

// ─── Composant Avatar ─────────────────────────────────────────────────────────
function Avatar({ initiales }) {
  const color = getAvatarColor(initiales);
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${color.bg} ${color.text}`}
    >
      {initiales}
    </div>
  );
}

// ─── Badge Statut ─────────────────────────────────────────────────────────────
function StatutBadge({ state }) {
  if (state === "GRADED") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
        Corrigée
      </span>
    );
  }
  if (state === "SUBMITTED") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
        À corriger
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
      Ouvert
    </span>
  );
}

// ─── VUE 1 : Liste des devoirs ────────────────────────────────────────────────
function ListeDevoirs({ onVoirDevoir }) {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Évaluations</h1>
        </div>

        {/* Barre compteur + bouton */}
        <Card className="mb-5 border border-gray-200 shadow-none rounded-xl">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {devoirsData.length} devoirs
            </span>
            <Button className="bg-slate-800 hover:bg-slate-900 text-white text-sm h-9 rounded-lg gap-1.5">
              <Plus className="w-4 h-4" />
              Ajouter un devoir
            </Button>
          </CardContent>
        </Card>

        {/* Liste */}
        <div className="flex flex-col gap-3">
          {devoirsData.map((devoir) => (
            <DevoirCard
              key={devoir.id}
              devoir={devoir}
              onVoir={() => onVoirDevoir(devoir)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Carte devoir (dans la liste) ─────────────────────────────────────────────
function DevoirCard({ devoir, onVoir }) {
  const nbSoumissions = devoir.submissions.length;
  const notesCorrigees = devoir.submissions.filter(
    (s) => s.state === "GRADED"
  );
  const noteMoy =
    notesCorrigees.length > 0
      ? (
          notesCorrigees.reduce((a, s) => a + s.grade, 0) /
          notesCorrigees.length
        ).toFixed(1)
      : "—";

  return (
    <Card className="border border-gray-200 shadow-none rounded-xl bg-white">
      <CardContent className="p-5 flex flex-col gap-3">
        {/* Titre + statut */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-semibold text-gray-900">
              {devoir.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {devoir.course.title} ({devoir.course.shortName})
            </p>
          </div>
          <StatutBadge state="ouvert" />
        </div>

        {/* Méta */}
        <div className="flex gap-6">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Échéance
            </p>
            <p className="text-sm font-medium text-gray-800">
              {devoir.dueDate ? new Date(devoir.dueDate * 1000).toLocaleDateString('fr-FR') : 'Non définie'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Soumissions
            </p>
            <p className="text-sm font-medium text-gray-800">
              {nbSoumissions}/28
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Note moy.
            </p>
            <p className="text-sm font-medium text-gray-800">
              {noteMoy}/20
            </p>
          </div>
        </div>

        {/* Bouton */}
        <div className="flex justify-end">
          <Button
            onClick={onVoir}
            className="bg-slate-800 hover:bg-slate-900 text-white text-sm h-9 rounded-lg"
          >
            Voir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── VUE 2 : Détail d'un devoir ───────────────────────────────────────────────
function DetailDevoir({ devoir, onRetour, onVoirSoumission }) {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{devoir.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {devoir.course.title} ({devoir.course.shortName}) · Moodle
            </p>
          </div>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 h-9 rounded-lg gap-1.5 text-sm"
            onClick={onRetour}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </div>

        {/* Infos devoir */}
        <Card className="border border-gray-200 shadow-none rounded-xl bg-white mb-4">
          <CardContent className="p-5">
            {/* Statut + points */}
            <div className="flex items-center gap-3 mb-5">
              <StatutBadge state="ouvert" />
              <span className="text-sm font-medium text-gray-700">
                20 points
              </span>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-lg p-3 mb-5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mb-1">
                Description
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {devoir.intro}
              </p>
            </div>

            <Separator className="mb-4" />

            {/* Champs */}
            <div className="flex flex-col gap-4">
              {/* Cours */}
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Cours
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {devoir.course.shortName}
                  </p>
                </div>
              </div>

              {/* Fichier du devoir */}
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Fichier
                  </p>
                  <p className="text-sm font-medium text-slate-700 underline underline-offset-2 cursor-pointer">
                    Consigne.pdf
                  </p>
                </div>
              </div>

              {/* Échéance */}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Échéance
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {devoir.dueDate ? new Date(devoir.dueDate * 1000).toLocaleDateString('fr-FR') : 'Non définie'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Soumissions */}
        <Card className="border border-gray-200 shadow-none rounded-xl bg-white">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">
              Soumissions{" "}
              <span className="font-normal text-gray-400">
                ({devoir.submissions.length})
              </span>
            </p>
            <div className="flex flex-col divide-y divide-gray-100">
              {devoir.submissions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Avatar initiales={s.studentInitials} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{s.studentName}</p>
                    <p className="text-xs text-gray-400">{s.submittedAt ? new Date(s.submittedAt * 1000).toLocaleDateString('fr-FR') : 'Non définie'}</p>
                  </div>
                  {s.state === "GRADED" ? (
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      {s.grade} pts
                    </span>
                  ) : (
                    <StatutBadge state="SUBMITTED" />
                  )}
                  <Button
                    onClick={() => onVoirSoumission(s)}
                    variant="outline"
                    className="border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white text-xs h-8 rounded-lg px-3 transition-colors"
                  >
                    Voir
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── VUE 3 : Détail d'une soumission ─────────────────────────────────────────
function DetailSoumission({ soumission, devoir, onRetour, onSauvegarder }) {
  const [note, setNote] = useState(soumission.grade ?? "");
  const [commentaire, setCommentaire] = useState(soumission.feedback ?? "");

  function handleSave() {
    onSauvegarder({ ...soumission, grade: Number(note), feedback: commentaire, state: "GRADED" });
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {soumission.studentName}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {devoir.name} · {devoir.course.shortName}
            </p>
          </div>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 h-9 rounded-lg gap-1.5 text-sm"
            onClick={onRetour}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </div>

        {/* Infos soumission */}
        <Card className="border border-gray-200 shadow-none rounded-xl bg-white mb-4">
          <CardContent className="p-5">
            {/* Statut + date */}
            <div className="flex items-center gap-3 mb-5">
              <StatutBadge state={soumission.state} />
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Envoyé le {soumission.submittedAt ? new Date(soumission.submittedAt * 1000).toLocaleDateString('fr-FR') : 'Non définie'}
              </span>
            </div>

            <Separator className="mb-4" />

            <div className="flex flex-col gap-4">
              {/* Étudiant */}
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Étudiant
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {soumission.studentName}
                  </p>
                </div>
              </div>

              {/* Devoir */}
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Devoir
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {devoir.name}
                  </p>
                </div>
              </div>

              {/* Fichier */}
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    Fichier
                  </p>
                  <p className="text-sm font-medium text-slate-700 underline underline-offset-2 cursor-pointer">
                    {soumission.fileName}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Correction */}
        <Card className="border border-gray-200 shadow-none rounded-xl bg-white">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-gray-800 mb-5">
              Correction
            </p>

            {/* Note */}
            <div className="mb-5">
              <Label className="text-sm text-gray-600 mb-2 block">
                Note attribuée
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  min={0}
                  max={20}
                  className="w-20 h-10 text-base font-medium border-gray-300 rounded-lg focus:border-slate-800 focus:ring-slate-800"
                />
                <span className="text-sm text-gray-500 font-medium">
                  / 20
                </span>
              </div>
            </div>

            {/* Commentaire */}
            <div className="mb-6">
              <Label className="text-sm text-gray-600 mb-2 block">
                Commentaire
              </Label>
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                className="min-h-[90px] border-gray-300 rounded-lg text-sm focus:border-slate-800 focus:ring-slate-800"
                placeholder="Ajouter un commentaire..."
              />
            </div>

            {/* Bouton */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                className="bg-slate-800 hover:bg-slate-900 text-white h-10 rounded-lg gap-2 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Enregistrer la correction
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── interface principale principale (routeur) ─────────────────────────────────────────────────
export default function Assignment() {
  const [vue, setVue] = useState("liste"); // "liste" | "devoir" | "soumission"
  const [devoirs, setDevoirs] = useState(devoirsData);
  const [devoirActuel, setDevoirActuel] = useState(null);
  const [soumissionActuelle, setSoumissionActuelle] = useState(null);

  function ouvrirDevoir(devoir) {
    setDevoirActuel(devoirs.find((d) => d.id === devoir.id));
    setVue("devoir");
  }

  function ouvrirSoumission(soumission) {
    setSoumissionActuelle(soumission);
    setVue("soumission");
  }

  function sauvegarderCorrection(soumissionMaj) {
    setDevoirs((prev) =>
      prev.map((d) =>
        d.id === devoirActuel.id
          ? {
              ...d,
              soumissions: d.soumissions.map((s) =>
                s.id === soumissionMaj.id ? soumissionMaj : s
              ),
            }
          : d
      )
    );
    const devoirMaj = {
      ...devoirActuel,
      soumissions: devoirActuel.soumissions.map((s) =>
        s.id === soumissionMaj.id ? soumissionMaj : s
      ),
    };
    setDevoirActuel(devoirMaj);
    setVue("devoir");
  }

  if (vue === "liste") {
    return <ListeDevoirs onVoirDevoir={ouvrirDevoir} />;
  }
  if (vue === "devoir" && devoirActuel) {
    return (
      <DetailDevoir
        devoir={devoirActuel}
        onRetour={() => setVue("liste")}
        onVoirSoumission={ouvrirSoumission}
      />
    );
  }
  if (vue === "soumission" && soumissionActuelle) {
    return (
      <DetailSoumission
        soumission={soumissionActuelle}
        devoir={devoirActuel}
        onRetour={() => setVue("devoir")}
        onSauvegarder={sauvegarderCorrection}
      />
    );
  }
  return null;
}