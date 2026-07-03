import {
  getStudentSubmissionStatus,
  getStudentStatusLabel,
  getStudentStatusHint,
  STUDENT_SUBMISSION_STATUS,
} from "@/services/assignments.service";
import { CheckCircle, FileEdit, CircleDashed, Award } from "lucide-react";

const STATUS_STYLES = {
  [STUDENT_SUBMISSION_STATUS.NOT_SENT]: {
    className:
      "bg-slate-100 text-slate-700 ring-slate-600/20",
    Icon: CircleDashed,
  },
  [STUDENT_SUBMISSION_STATUS.DRAFT]: {
    className:
      "bg-amber-50 text-amber-800 ring-amber-600/20",
    Icon: FileEdit,
  },
  [STUDENT_SUBMISSION_STATUS.SUBMITTED]: {
    className:
      "bg-blue-50 text-blue-700 ring-blue-600/20",
    Icon: CheckCircle,
  },
  [STUDENT_SUBMISSION_STATUS.GRADED]: {
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Icon: Award,
  },
};

export function StudentStatusBadge({ assignment, showGrade = true }) {
  const status = getStudentSubmissionStatus(assignment);
  const { className, Icon } = STATUS_STYLES[status];
  const maxGrade = assignment.gradeMax ?? assignment.maxGrade ?? 20;
  const grade = assignment.submission?.grade;

  let label = getStudentStatusLabel(status);
  if (status === STUDENT_SUBMISSION_STATUS.GRADED && showGrade && grade != null) {
    label = `${label} — ${grade}/${maxGrade}`;
  }

  return (
    <span
      title={getStudentStatusHint(status)}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest ring-1 ring-inset shrink-0 ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}
