import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Calendar,
  FileText,
  User,
  CheckCircle,
} from "lucide-react";

export default function DetailSoumission({ soumission, devoir, onRetour, onSauvegarder }) {
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
            <h1 className="text-2xl font-bold text-slate-800">
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
                  <p className="text-sm font-medium text-slate-800">
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
                  <p className="text-sm font-medium text-slate-800">
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