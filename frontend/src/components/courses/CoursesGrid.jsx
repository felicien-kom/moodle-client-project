import { CourseCard } from "./CourseCard";

/**
 * Grille de cours réutilisable
 * Skeleton loading premium + grid responsive
 */
export function CoursesGrid({
  courses = [],
  isLoading = false,
  onCardEdit,
  onCardDelete,
  onCardEnroll,
  onCardUnenroll,
  onCardViewDetails,
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array(8)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden animate-pulse">
              <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-100" />
              <div className="p-4 flex flex-col gap-3">
                <div className="h-4 w-2/3 rounded bg-slate-200" />
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-4/5 rounded bg-slate-100" />
                <div className="h-8 w-full rounded-lg bg-slate-200 mt-2" />
              </div>
            </div>
          ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return null; // L'EmptyState est géré par le parent
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          courseId={course.id}
          image={course.image}
          title={course.title}
          description={course.description}
          createdBy={course.createdBy}
          createdByName={course.createdByName}
          startDate={course.startDate}
          endDate={course.endDate}
          category={course.category}
          sections={course.sections}
          isEnrolled={course.isEnrolled}
          isNew={course.isNew}
          rating={course.rating}
          progress={course.progress}
          onEdit={onCardEdit}
          onDelete={onCardDelete}
          onEnroll={onCardEnroll}
          onUnenroll={onCardUnenroll}
          onViewDetails={onCardViewDetails}
        />
      ))}
    </div>
  );
}

export default CoursesGrid;
