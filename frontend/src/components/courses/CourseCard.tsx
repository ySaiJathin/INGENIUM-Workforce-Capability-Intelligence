import React from 'react';
import { Course } from '../../types';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../ui/StatusBadge';
import { Clock, Award, CheckCircle, Plus, Star, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const { addCourseToLearningPath, learningPath } = useApp();
  const isAlreadyInPath = learningPath.steps.some(s => s.courseId === course.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addCourseToLearningPath(course);
  };

  return (
    <div className="card-enterprise p-6 hover:shadow-md transition-all flex flex-col justify-between border-slate-200">
      <div>
        {/* Top Badges & Provider */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
              {course.provider}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
              {course.providerBadge}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-800 font-mono">
              {course.matchScore == null ? 'Exact Match' : `${course.matchScore}% Match`}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
          <Link to={`/courses/${course.id}`} className="hover:text-blue-700 transition-colors">
            {course.title}
          </Link>
        </h3>

        {/* Metadata row */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{course.durationHours} Hours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-slate-400" />
            <span>{course.difficulty}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{course.rating}</span>
            <span className="text-slate-400 font-normal">({course.reviewsCount})</span>
          </div>
        </div>

        {/* Explicit WHY THIS COURSE WAS RECOMMENDED */}
        <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 mb-4 space-y-1.5">
          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-900 uppercase tracking-wider">
            <CheckCircle className="w-3.5 h-3.5 text-blue-700" />
            <span>Why Recommended (Targeted Gap Closure)</span>
          </div>
          <p className="text-xs text-blue-950 font-medium leading-relaxed">
            {course.closesGapDescription}
          </p>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-blue-800 font-mono">
            <span>Expected Pathway:</span>
            <span className="font-bold bg-white px-2 py-0.5 rounded border border-blue-200">
              Level {course.expectedPathway.fromLevel} → Level {course.expectedPathway.toLevel}
            </span>
          </div>
        </div>

        {/* Competencies covered tags */}
        <div className="mb-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
            Competencies Addressed
          </span>
          <div className="flex flex-wrap gap-1.5">
            {course.targetGapCompetencies.map((comp, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
              >
                {comp}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <Link
          to={`/courses/${course.id}`}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2"
        >
          View Course Syllabus
        </Link>

        {isAlreadyInPath ? (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            In Learning Path
          </span>
        ) : (
          <button
            onClick={handleAdd}
            className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Learning Path</span>
          </button>
        )}
      </div>
    </div>
  );
};
