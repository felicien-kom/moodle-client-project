import { Calendar, ChevronRight, FileText } from "lucide-react";
import { stripHtml, getStudentSubmissionStatus, STUDENT_SUBMISSION_STATUS } from "@/services/assignments.service";
import { StudentStatusBadge } from "./StudentStatusBadge";

export function StudentAssignmentListItem({ assignment, onClick, showGrade = false }) {
  const now = Date.now() / 1000;
  const isLate =
    assignment.dueDate &&
    now > assignment.dueDate &&
    assignment.submission?.state !== "SUBMITTED" &&
    assignment.submission?.state !== "GRADED";

  const status = getStudentSubmissionStatus(assignment);
  const showGradeOnList = showGrade || status === STUDENT_SUBMISSION_STATUS.GRADED;
  const maxGrade = assignment.gradeMax ?? 20;
  const grade = assignment.submission?.grade;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="w-10 h-10 rounded-lg bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center shrink-0 transition-colors">
        <FileText className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1">
          {assignment.name}
        </h4>
        <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">
          {stripHtml(assignment.intro || assignment.activity) || "Consignes disponibles dans le détail"}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <StudentStatusBadge assignment={assignment} showGrade={showGradeOnList} />
          <span className="text-slate-300 hidden sm:inline">·</span>
          <Calendar className={`w-3.5 h-3.5 ${isLate ? "text-red-500" : "text-slate-400"}`} />
          <span className={`text-xs font-medium ${isLate ? "text-red-600" : "text-slate-500"}`}>
            {assignment.dueDate
              ? new Date(assignment.dueDate * 1000).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Sans échéance"}
          </span>
        </div>
      </div>

      {showGradeOnList && grade != null && (
        <div className="shrink-0 text-right">
          <p className="text-lg font-black text-emerald-600">{grade}</p>
          <p className="text-[10px] text-slate-400 font-medium">/{maxGrade}</p>
        </div>
      )}

      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 shrink-0 transition-colors" />
    </button>
  );
}
