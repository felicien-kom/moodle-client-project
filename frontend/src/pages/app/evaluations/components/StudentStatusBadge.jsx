import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Clock, RefreshCw, UploadCloud } from "lucide-react";

export function StudentStatusBadge({ assignment }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [isLate, setIsLate] = useState(false);

  const state = assignment.submission?.state;
  const syncStatus = assignment.submission?.sync_status;
  const maxGrade = assignment.gradeMax ?? assignment.maxGrade ?? 20;

  const isSubmitted = state === "SUBMITTED" || state === "GRADED";
  const isGraded = state === "GRADED";

  useEffect(() => {
    if (isSubmitted || !assignment.dueDate) return;

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = assignment.dueDate - now;

      if (diff < 0) {
        setIsLate(true);
        setTimeLeft("Temps écoulé");
        setIsCritical(true);
      } else {
        setIsLate(false);
        const days = Math.floor(diff / (24 * 3600));
        const hours = Math.floor((diff % (24 * 3600)) / 3600);

        let timeStr = "";
        if (days > 0) timeStr += `${days}j `;
        timeStr += `${hours}h restants`;

        setTimeLeft(timeStr);
        setIsCritical(diff <= 48 * 3600);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [assignment.dueDate, isSubmitted]);

  if (syncStatus === "CONFLICT") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 uppercase tracking-widest ring-1 ring-inset ring-amber-600/20">
        <AlertCircle className="w-3.5 h-3.5 animate-pulse text-amber-600" /> Conflit résolu
      </span>
    );
  }

  if (isGraded) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 uppercase tracking-widest ring-1 ring-inset ring-emerald-600/20">
        <CheckCircle className="w-3.5 h-3.5" /> Note : {assignment.submission.grade}/{maxGrade}
      </span>
    );
  }

  if (state === "SUBMITTED") {
    if (syncStatus === "PENDING_PUSH") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-orange-50 text-orange-700 uppercase tracking-widest ring-1 ring-inset ring-orange-600/20">
          <UploadCloud className="w-3.5 h-3.5" /> Prêt à envoyer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 uppercase tracking-widest ring-1 ring-inset ring-blue-600/20">
        <CheckCircle className="w-3.5 h-3.5" /> Remis
      </span>
    );
  }

  if (state === "DRAFT") {
    if (syncStatus === "PENDING_PUSH") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-orange-50 text-orange-700 uppercase tracking-widest ring-1 ring-inset ring-orange-600/20">
          <RefreshCw className="w-3.5 h-3.5" /> Brouillon local
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 uppercase tracking-widest ring-1 ring-inset ring-slate-600/20">
        <CheckCircle className="w-3.5 h-3.5" /> Brouillon sauvegardé
      </span>
    );
  }

  if (!assignment.dueDate) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-green-50 text-green-700 uppercase tracking-widest ring-1 ring-inset ring-green-600/20">
        <Clock className="w-3.5 h-3.5" /> Sans échéance
      </span>
    );
  }

  if (isLate) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-red-50 text-red-600 uppercase tracking-widest ring-1 ring-inset ring-red-600/20">
        <AlertCircle className="w-3.5 h-3.5" /> En retard
      </span>
    );
  }

  if (isCritical) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-red-50 text-red-600 uppercase tracking-widest ring-1 ring-inset ring-red-600/20">
        <Clock className="w-3.5 h-3.5" /> {timeLeft}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-green-50 text-green-700 uppercase tracking-widest ring-1 ring-inset ring-green-600/20">
      <Clock className="w-3.5 h-3.5" /> {timeLeft}
    </span>
  );
}
