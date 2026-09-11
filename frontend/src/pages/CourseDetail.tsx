import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  Clock,
  Award,
  Star,
  CheckCircle,
  Plus,
  ArrowRight,
  BookOpen,
  Sparkles,
  Layers,
  GraduationCap,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';

export const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { allCourses, addCourseToLearningPath, learningPath, loading, errors } = useApp();

  if (loading.courses) {
    return <LoadingState label="Loading course catalog…" />;
  }
  if (errors.courses) {
    return <ErrorState error={errors.courses} />;
  }

  const course = allCourses.find((c) => c.id === courseId) || allCourses[0];
  if (!course) {
    return <ErrorState error={new Error('This course could not be found in the catalog.')} />;
  }
  const isAlreadyInPath = learningPath.steps.some((s) => s.courseId === course.id);

  const handleAddAndProceed = () => {
    addCourseToLearningPath(course);
    navigate('/learning-path');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={course.title}
        subtitle={`${course.provider} • ${course.providerBadge} • ${course.format}`}
        backPath="/courses"
        nextPath="/learning-path"
        nextLabel="View Learning Path"
        breadcrumbs={[
          { label: 'Courses', path: '/courses' },
          { label: course.title }
        ]}
        actions={
          isAlreadyInPath ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Enrolled in Learning Path</span>
            </span>
          ) : (
            <button
              onClick={handleAddAndProceed}
              className="btn-primary text-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Learning Path</span>
            </button>
          )
        }
      />

      {/* Top Banner Overview */}
      <div className="card-enterprise p-6 lg:p-8 bg-white space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-mono text-xs font-bold uppercase">
                {course.provider}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                {course.providerBadge}
              </span>
              <StatusBadge status={course.priority} size="sm" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{course.durationHours} Hours</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-slate-500" />
              <span>{course.difficulty}</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{course.rating}</span>
            </div>
          </div>
        </div>

        {/* Core Rationale Box */}
        <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-blue-700" />
            <span>Targeted Capability Gap Remediation Rationale</span>
          </div>
          <p className="text-xs text-blue-950 font-medium leading-relaxed">
            {course.closesGapDescription}
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs text-blue-800 font-mono">
            <span>Projected Competency Trajectory:</span>
            <span className="font-bold bg-white px-2.5 py-1 rounded border border-blue-200">
              Level {course.expectedPathway.fromLevel} → Level {course.expectedPathway.toLevel}
            </span>
          </div>
        </div>

        {/* Course Description */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">Course Overview</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{course.overview}</p>
        </div>
      </div>

      {/* Modules & Outcomes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modules Breakdown (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-enterprise p-6 bg-white space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">
                Syllabus & Modules Breakdown
              </h3>
            </div>

            {course.modules.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Detailed module breakdown is not yet available for this course.
              </p>
            ) : (
              <div className="space-y-3">
                {course.modules.map((mod, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="text-xs font-bold text-slate-900">{mod.title}</h4>
                      <span className="text-[11px] font-mono text-slate-500">{mod.duration}</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {mod.topics.map((topic, tIdx) => (
                        <li key={tIdx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Prerequisites & Learning Outcomes */}
        <div className="space-y-4">
          <div className="card-enterprise p-5 bg-white space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Target Competencies
              </span>
              <div className="flex flex-wrap gap-1.5">
                {course.targetGapCompetencies.map((comp, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-xs font-medium border border-blue-200"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Prerequisites
              </span>
              {course.prerequisites.length === 0 ? (
                <p className="text-xs text-slate-500 italic">None specified for this course.</p>
              ) : (
                <ul className="space-y-1 text-xs text-slate-600">
                  {course.prerequisites.map((p, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Key Learning Outcomes
              </span>
              {course.learningOutcomes.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Detailed learning outcomes are not yet available for this course.
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {course.learningOutcomes.map((lo, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{lo}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
