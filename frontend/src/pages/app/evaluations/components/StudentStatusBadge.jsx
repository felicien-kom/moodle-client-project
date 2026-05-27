import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

export function StudentStatusBadge({ assignment }) {
  const isSubmitted = assignment.submission?.state === "SUBMITTED" || assignment.submission?.state === "GRADED";
  const isGraded = assignment.submission?.state === "GRADED";
  
  const [timeLeft, setTimeLeft] = useState("");
  const [isCritical, setIsCritical] = useState(false);
  const [isLate, setIsLate] = useState(false);

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
        setIsCritical(diff <= 48 * 3600); // <= 48h
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // check every minute
    return () => clearInterval(interval);
  }, [assignment.dueDate, isSubmitted]);

  if (isGraded) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 uppercase tracking-widest ring-1 ring-inset ring-emerald-600/20">
        <CheckCircle className="w-3.5 h-3.5" /> Note : {assignment.submission.grade}/20
      </span>
    );
  }
  if (isSubmitted) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 uppercase tracking-widest ring-1 ring-inset ring-blue-600/20">
        <CheckCircle className="w-3.5 h-3.5" /> Remis
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

  // C'est ici le countdown (Critique = rouge, Normal = Vert)
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
