import { Calendar, ArrowLeft } from "lucide-react";
import { stripHtml } from "@/services/assignments.service";

export function AssignmentCard({ assignment, onClick, role }) {
  const isTeacher = role === "teacher";
  const now = Date.now() / 1000;
  const isLate =
    assignment.dueDate &&
    now > assignment.dueDate &&
    (!assignment.submission ||
      assignment.submission.state === "DRAFT" ||
      !assignment.submission.state);

  const introPreview =
    stripHtml(assignment.intro || assignment.activity) ||
    "Aucune description fournie pour cette évaluation.";

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden p-6 md:p-8"
    >
      <div className="flex justify-between items-start mb-4 gap-4">
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-widest shrink-0">
          {assignment.course?.shortName || "Cours"}
        </span>
        {isTeacher && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 uppercase tracking-widest ring-1 ring-inset ring-indigo-600/20">
            {assignment.submittedCount || 0}/{assignment.totalCount || 0} Remis
          </span>
        )}
      </div>

      <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
        {assignment.name}
      </h3>

      <p className="text-sm font-medium text-slate-500 line-clamp-2 mb-6 leading-relaxed">
        {introPreview}
      </p>

      <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className={`w-4 h-4 ${!isTeacher && isLate ? "text-red-500" : "text-slate-400"}`} />
          <span className={`text-xs font-bold uppercase tracking-wide ${!isTeacher && isLate ? "text-red-600" : "text-slate-600"}`}>
            Échéance : {assignment.dueDate ? new Date(assignment.dueDate * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Aucune date'}
          </span>
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white text-slate-400 transition-colors">
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </div>
      </div>
    </div>
  );
}
