import { BookOpen, ChevronRight, Calendar, ClipboardList } from "lucide-react";

export function StudentCourseList({ courseGroups, onSelectCourse }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {courseGroups.map(({ course, assignments }, index) => {
        const nextDue = assignments
          .filter((a) => a.dueDate)
          .sort((a, b) => a.dueDate - b.dueDate)[0];

        return (
          <button
            key={course.id}
            type="button"
            onClick={() => onSelectCourse({ course, assignments })}
            className="group text-left flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-[#2A78C2]/30 hover:-translate-y-0.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 60}ms`, animationFillMode: "backwards" }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#2A78C2]/10 flex items-center justify-center shrink-0 group-hover:bg-[#2A78C2]/20 transition-colors">
                <BookOpen className="w-5 h-5 text-[#2A78C2]" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2A78C2] bg-[#2A78C2]/10 px-2.5 py-1 rounded-full">
                <ClipboardList className="w-3 h-3" />
                {assignments.length} devoir{assignments.length > 1 ? "s" : ""}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#2A78C2] transition-colors line-clamp-2 mb-1">
              {course.title}
            </h3>
            {course.shortName && (
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                {course.shortName}
              </p>
            )}

            {nextDue && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-auto pt-3 border-t border-slate-100">
                <Calendar className="w-3.5 h-3.5" />
                Prochaine échéance :{" "}
                {new Date(nextDue.dueDate * 1000).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            )}

            <div className="flex items-center justify-end mt-3 text-[#2A78C2] opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-semibold mr-1">Voir les devoirs</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
