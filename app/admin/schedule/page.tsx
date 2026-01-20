"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/Calendar";
import { Card } from "@/components/ui/card";
import { TeacherScheduleView } from "@/components/TeacherScheduleView";
import { LoadingSpinner, Skeleton } from "@/components/ui/loading";
import { Users, Calendar as CalendarIcon, Grid, BookOpen, UserCheck, Clock, Filter } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

export default function SchedulePage() {
  const lectures = useQuery(api.queries.lectures.getAll);
  const teachers = useQuery(api.queries.teachers.getAll);
  const [view, setView] = useState<"calendar" | "periods">("periods");
  const [scheduleView, setScheduleView] = useState<"week" | "month">("week");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [academicYear] = useState("2025-2026"); // Read-only, always 2025-2026
  const [showForm, setShowForm] = useState(false);
  const [editingLecture, setEditingLecture] = useState<string | null>(null);

  const periods = useQuery(api.queries.periods.getByAcademicYear, { academicYear });
  const subjects = useQuery(api.queries.subjects.getAll);
  
  // Get teacher schedule data
  const teacherSchedule = useQuery(
    api.queries.lectures.getTeacherScheduleByPeriods,
    selectedTeacherId && academicYear
      ? { teacherId: selectedTeacherId as Id<"teachers">, academicYear }
      : "skip"
  );

  // Get teacher lectures with details for period view
  const teacherLectures = useQuery(
    api.queries.lectures.getByTeacherWithDetails,
    selectedTeacherId
      ? { teacherId: selectedTeacherId as Id<"teachers">, academicYear }
      : "skip"
  );
  
  // Check if sections exist for the academic year
  const sectionsForYear = useQuery(api.queries.sections.getByAcademicYear, { academicYear });

  if (!lectures || !teachers || !periods || !subjects) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const selectedTeacher = teachers.find((t: any) => t._id === selectedTeacherId);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Schedule</h1>
          <p className="mt-1 text-sm text-gray-600">Manage and view teacher schedules</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={academicYear}
            disabled
            className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 cursor-not-allowed shadow-sm"
          >
            <option value="2025-2026">2025-2026</option>
          </select>
          <Button
            variant={view === "periods" ? "default" : "outline"}
            onClick={() => setView("periods")}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <Grid className="mr-2 h-4 w-4" />
            Period View
          </Button>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transition-all"
          >
            Add Lecture
          </Button>
        </div>
      </div>

      {view === "periods" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 min-w-0">
            <Card className="shadow-xl border-gray-200/80 bg-white/80 backdrop-blur-sm card-hover">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200/50 px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 max-w-md">
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                      Select Teacher
                    </label>
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 hover:border-blue-400 hover:shadow-md"
                    >
                      <option value="">All Teachers</option>
                      {teachers.map((teacher: any) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedTeacherId && selectedTeacher && (
                    <div className="hidden md:flex items-center gap-3 ml-4 animate-slideIn">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/30">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Selected Teacher</p>
                        <p className="text-sm font-semibold text-gray-900">{selectedTeacher.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3">
                {selectedTeacherId && teacherLectures && periods ? (
                  <TeacherScheduleView
                    periods={periods}
                    lectures={teacherLectures}
                    teacherName={selectedTeacher?.name}
                    lang="en"
                    onLectureClick={(lecture) => setEditingLecture(lecture._id)}
                  />
                ) : selectedTeacherId ? (
                  <div className="flex items-center justify-center py-16">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
                      <Users className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Teacher</h3>
                    <p className="text-sm text-gray-600 max-w-sm mx-auto">
                      Choose a teacher from the dropdown above to view their weekly schedule organized by periods and days.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          {selectedTeacherId && selectedTeacher && (
            <TeacherInfoSidebar
              teacher={selectedTeacher}
              teacherLectures={teacherLectures || []}
              allTeachers={teachers || []}
              academicYear={academicYear}
              periods={periods || []}
              subjects={subjects || []}
            />
          )}
        </div>
      )}

      {view === "calendar" && (
        <Card className="p-4">
          <div className="mb-4 flex gap-2">
            <Button
              variant={scheduleView === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setScheduleView("week")}
            >
              Week
            </Button>
            <Button
              variant={scheduleView === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setScheduleView("month")}
            >
              Month
            </Button>
          </div>
          <Calendar
            lectures={lectures}
            view={scheduleView}
            onLectureClick={(lecture) => setEditingLecture(lecture._id)}
          />
        </Card>
      )}

      {showForm && (
        <ScheduleForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
          }}
        />
      )}

      {editingLecture && (
        <ScheduleForm
          lectureId={editingLecture}
          onClose={() => setEditingLecture(null)}
          onSuccess={() => {
            setEditingLecture(null);
          }}
        />
      )}
    </div>
  );
}

function ScheduleForm({
  lectureId,
  onClose,
  onSuccess,
}: {
  lectureId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [teacherId, setTeacherId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [curriculumId, setCurriculumId] = useState(""); // Subject/Curriculum ID
  const [lessonId, setLessonId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [periodId, setPeriodId] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [recurring, setRecurring] = useState(true);
  const [academicYear] = useState("2025-2026"); // Read-only, always 2025-2026
  const [conflicts, setConflicts] = useState<any>(null);

  const teachers = useQuery(api.queries.teachers.getAll);
  const sections = useQuery(api.queries.sections.getAll);
  const curriculum = useQuery(api.queries.curriculum.getFullCurriculum);
  const periods = useQuery(
    api.queries.periods.getByAcademicYear,
    { academicYear }
  );
  const createLecture = useMutation(api.mutations.lectures.create);
  const updateLecture = useMutation(api.mutations.lectures.update);
  const lecture = useQuery(
    api.queries.lectures.getById,
    lectureId ? { id: lectureId as any } : "skip"
  );

  // Update times when period is selected
  const handlePeriodChange = (selectedPeriodId: string) => {
    setPeriodId(selectedPeriodId);
    const period = periods?.find((p: any) => p._id === selectedPeriodId);
    if (period && !period.isBreak) {
      setStartTime(period.startTime);
      setEndTime(period.endTime);
    }
  };

  // Get available subjects (curriculum) - filter by teacher's subjects if teacher is selected
  const teacher = teachers?.find((t: any) => t._id === teacherId);
  const availableSubjects = curriculum?.filter((subject: any) =>
    !teacherId || teacher?.subjects.includes(subject._id)
  ) || [];

  // Get lessons based on selected curriculum/subject
  const selectedSubject = curriculum?.find((s: any) => s._id === curriculumId);
  const availableLessons = selectedSubject
    ? selectedSubject.units.flatMap((unit: any) => unit.lessons)
    : [];

  // Update form when lecture data loads
  if (lecture && lectureId && teacherId === "") {
    setTeacherId(lecture.teacherId);
    // Handle backward compatibility: use sectionId if available, otherwise classId
    setSectionId((lecture.sectionId || lecture.classId) as any);
    setLessonId(lecture.lessonId);
    setDayOfWeek(lecture.dayOfWeek);
    setStartTime(lecture.startTime);
    setEndTime(lecture.endTime);
    setRecurring(lecture.recurring);
    // academicYear is read-only, always 2025-2026
    
    // Find the subject/curriculum for the selected lesson
    if (curriculum && lecture.lessonId) {
      for (const subject of curriculum) {
        for (const unit of subject.units) {
          if (unit.lessons.some((l: any) => l._id === lecture.lessonId)) {
            setCurriculumId(subject._id);
            break;
          }
        }
      }
    }
    
    // Use periodId if it exists, otherwise find matching period by time
    if (lecture.periodId) {
      setPeriodId(lecture.periodId);
    } else if (periods) {
      const matchingPeriod = periods.find((p: any) => {
        if (p.isBreak) return false;
        return p.startTime === lecture.startTime && p.endTime === lecture.endTime;
      });
      if (matchingPeriod) {
        setPeriodId(matchingPeriod._id);
      }
    }
  }

  // Real-time conflict checking using Convex queries
  const teacherConflicts = useQuery(
    api.queries.conflicts.checkTeacherConflict,
    teacherId && startTime && endTime
      ? {
          teacherId: teacherId as any,
          dayOfWeek,
          startTime,
          endTime,
          excludeLectureId: lectureId as any,
          academicYear,
        }
      : "skip"
  );
  const sectionConflicts = useQuery(
    api.queries.conflicts.checkSectionConflict,
    sectionId && startTime && endTime
      ? {
          sectionId: sectionId as any,
          dayOfWeek,
          startTime,
          endTime,
          excludeLectureId: lectureId as any,
          academicYear,
        }
      : "skip"
  );

  // Update conflicts state when queries change (real-time)
  useEffect(() => {
    if (teacherConflicts !== undefined || sectionConflicts !== undefined) {
      setConflicts({
        hasConflicts: (teacherConflicts?.length || 0) > 0 || (sectionConflicts?.length || 0) > 0,
        teacherConflicts: teacherConflicts || [],
        sectionConflicts: sectionConflicts || [],
      });
    }
  }, [teacherConflicts, sectionConflicts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (lectureId) {
        await updateLecture({
          id: lectureId as any,
          teacherId: teacherId as any,
          sectionId: sectionId as any,
          lessonId: lessonId as any,
          dayOfWeek,
          startTime,
          endTime,
          recurring,
          academicYear,
          periodId: periodId ? (periodId as any) : undefined,
        });
      } else {
        await createLecture({
          teacherId: teacherId as any,
          sectionId: sectionId as any,
          lessonId: lessonId as any,
          dayOfWeek,
          startTime,
          endTime,
          recurring,
          academicYear,
          periodId: periodId ? (periodId as any) : undefined,
        });
      }
      onSuccess();
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-visible">
        <div className="p-6 overflow-y-auto max-h-[90vh]">
          <h2 className="mb-4 text-2xl font-bold">
            {lectureId ? "Edit Lecture" : "Add Lecture"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Teacher</label>
              <select
                value={teacherId}
                onChange={(e) => {
                  setTeacherId(e.target.value);
                  setLessonId(""); // Reset lesson when teacher changes
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                required
              >
                <option value="">Select teacher</option>
                {teachers && Array.isArray(teachers) && teachers.length > 0 ? (
                  teachers.map((t: any) => (
                    <option key={t._id} value={t._id}>
                      {t.name || 'Unnamed'}
                    </option>
                  ))
                ) : teachers === undefined ? (
                  <option disabled>Loading teachers...</option>
                ) : (
                  <option disabled>No teachers available</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Section</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                required
              >
                <option value="">Select section</option>
                {sections && Array.isArray(sections) && sections.length > 0 ? sections
                  .filter((s: any) => s.academicYear === academicYear)
                  .map((s: any) => (
                    <option key={s._id} value={s._id}>
                      {s.name} - {s.grade} ({s.numberOfStudents} students)
                    </option>
                  )) : (
                  <option disabled value="">No sections available - Please create sections first</option>
                )}
              </select>
              {(!sections || sections.length === 0) && (
                <p className="mt-1 text-xs text-amber-600">
                  Note: You need to create sections before adding lectures. Go to Admin → Sections to create sections.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Curriculum</label>
              <select
                value={curriculumId}
                onChange={(e) => {
                  setCurriculumId(e.target.value);
                  setLessonId(""); // Reset lesson when curriculum changes
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                required
                disabled={!teacherId}
              >
                <option value="">Select curriculum</option>
                {availableSubjects.length > 0 ? (
                  availableSubjects.map((subject: any) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))
                ) : curriculum === undefined ? (
                  <option disabled>Loading curriculum...</option>
                ) : (
                  <option disabled>No curriculum available{teacherId ? " for this teacher" : ""}</option>
                )}
              </select>
              {teacherId && availableSubjects.length === 0 && curriculum && (
                <p className="mt-1 text-xs text-amber-600">
                  Note: This teacher is not assigned to any subjects. Go to Admin → Teachers to assign subjects.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Lesson</label>
              <select
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                required
                disabled={!curriculumId}
              >
                <option value="">Select lesson</option>
                {availableLessons.length > 0 ? (
                  availableLessons.map((lesson: any) => (
                    <option key={lesson._id} value={lesson._id}>
                      {lesson.name}
                    </option>
                  ))
                ) : curriculumId ? (
                  <option disabled>No lessons available for this curriculum</option>
                ) : (
                  <option disabled>Select a curriculum first</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Day of Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Period</label>
              <select
                value={periodId}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                required
              >
                <option value="">Select period</option>
                {periods && Array.isArray(periods) && periods.length > 0 ? periods
                  .filter((p: any) => !p.isBreak)
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((period: any) => (
                    <option key={period._id} value={period._id}>
                      {period.nameAr || period.name} ({period.startTime} - {period.endTime})
                    </option>
                  )) : (
                  <option disabled value="">No periods available for {academicYear}</option>
                )}
              </select>
              {(!periods || periods.length === 0) && (
                <p className="mt-1 text-xs text-amber-600">
                  Note: Go to Admin → Periods and click &quot;Seed Default&quot; to create periods for {academicYear}.
                </p>
              )}
              {periodId && (
                <p className="mt-1 text-xs text-gray-500">
                  Time: {startTime} - {endTime}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Start Time (Manual Override)</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setPeriodId(""); // Clear period selection when manually editing
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">End Time (Manual Override)</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setPeriodId(""); // Clear period selection when manually editing
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                readOnly
                className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 cursor-not-allowed"
                placeholder="e.g., 2025-2026"
                required
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="mr-2"
                />
                Recurring (weekly)
              </label>
            </div>

            {conflicts && (
              <div
                className={`rounded-md p-3 ${
                  conflicts.hasConflicts
                    ? "bg-red-50 text-red-800"
                    : "bg-green-50 text-green-800"
                }`}
              >
                {conflicts.hasConflicts ? (
                  <div>
                    <p className="font-medium">Conflicts detected:</p>
                    {conflicts.teacherConflicts.length > 0 && (
                      <p>Teacher has {conflicts.teacherConflicts.length} conflict(s)</p>
                    )}
                    {conflicts.sectionConflicts && conflicts.sectionConflicts.length > 0 && (
                      <p>Section has {conflicts.sectionConflicts.length} conflict(s)</p>
                    )}
                  </div>
                ) : (
                  <p>No conflicts detected</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit">{lectureId ? "Update" : "Create"}</Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

function ReplacementTeacherCard({
  replacementTeacher,
  periods,
  academicYear,
}: {
  replacementTeacher: any;
  periods: any[];
  academicYear: string;
}) {
  // Query lectures for this replacement teacher
  const replacementLectures = useQuery(
    api.queries.lectures.getByTeacherWithDetails,
    replacementTeacher._id
      ? { teacherId: replacementTeacher._id, academicYear }
      : "skip"
  );

  // Get periods where the replacement teacher has lectures (busy periods)
  const busyPeriodIds = useMemo(() => {
    const busy = new Set();
    if (replacementLectures) {
      replacementLectures
        .filter((l: any) => l.recurring && l.academicYear === academicYear)
        .forEach((lecture: any) => {
          if (lecture.periodId) {
            busy.add(lecture.periodId);
          }
        });
    }
    return busy;
  }, [replacementLectures, academicYear]);

  // Find available periods (periods where replacement teacher has no lectures)
  const availablePeriods = useMemo(() => {
    if (!periods || periods.length === 0) {
      return [];
    }
    return periods
      .filter((p: any) => {
        if (!p || !p._id) {
          return false;
        }
        const isNotBreak = !p.isBreak;
        const periodIdStr = String(p._id);
        const isNotBusy = !busyPeriodIds.has(periodIdStr) && !busyPeriodIds.has(p._id);
        const matchesAcademicYear = p.academicYear === academicYear;
        return isNotBreak && isNotBusy && matchesAcademicYear;
      })
      .sort((a: any, b: any) => a.order - b.order);
  }, [periods, busyPeriodIds, academicYear]);

  return (
    <div className="p-4 rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm hover:border-green-400 hover:shadow-md hover:shadow-green-500/10 transition-all duration-300 card-hover">
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-900">{replacementTeacher.name}</p>
      </div>

      {/* Common Subjects */}
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-700 mb-1.5">Common Subjects:</p>
        <div className="flex flex-wrap gap-1.5">
          {replacementTeacher.commonSubjectNames.length > 0 ? (
            replacementTeacher.commonSubjectNames.map((subjectName: string, idx: number) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-800"
              >
                {subjectName}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500">No subjects found</span>
          )}
        </div>
      </div>

      {/* Available Periods */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-1.5">Available Periods:</p>
        {availablePeriods && availablePeriods.length > 0 ? (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1.5">
              {availablePeriods.slice(0, 6).map((period: any) => (
                <div
                  key={period._id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700 border border-blue-200"
                  title={`${period.name}: ${period.startTime} - ${period.endTime}`}
                >
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">{period.name}</span>
                </div>
              ))}
            </div>
            {availablePeriods.length > 6 && (
              <p className="text-xs text-gray-500 mt-1">
                +{availablePeriods.length - 6} more periods available
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">No available periods</p>
        )}
      </div>
    </div>
  );
}

function TeacherInfoSidebar({
  teacher,
  teacherLectures,
  allTeachers,
  academicYear,
  periods,
  subjects,
}: {
  teacher: any;
  teacherLectures: any[];
  allTeachers: any[];
  academicYear: string;
  periods: any[];
  subjects: any[];
}) {
  const [filterSubjectId, setFilterSubjectId] = useState<string>("");

  // Calculate total lectures per week (only recurring lectures)
  const weeklyLectures = teacherLectures.filter((lecture) => lecture.recurring && lecture.academicYear === academicYear);
  const totalLecturesPerWeek = weeklyLectures.length;

  // Create a map of subject IDs to names
  const subjectMap = useMemo(() => {
    const map = new Map();
    subjects.forEach((subject: any) => {
      map.set(subject._id, subject.name);
    });
    return map;
  }, [subjects]);

  // Get teacher's subjects for filter dropdown
  const teacherSubjects = useMemo(() => {
    const teacherSubjectIds = teacher.subjects || [];
    return teacherSubjectIds
      .map((id: any) => {
        const subject = subjects.find((s: any) => s._id === id);
        return subject ? { id: subject._id, name: subject.name } : null;
      })
      .filter(Boolean);
  }, [teacher.subjects, subjects]);

  // Find available replacement teachers with details
  const replacementTeachersData = useMemo(() => {
    const teacherSubjectIds = teacher.subjects || [];
    return allTeachers
      .filter((t: any) => {
        if (t._id === teacher._id) return false;
        if (!t.subjects || t.subjects.length === 0) return false;
        return t.subjects.some((subjectId: any) => teacherSubjectIds.includes(subjectId));
      })
      .map((replacementTeacher: any) => {
        // Get common subject IDs and names
        const commonSubjectIds = replacementTeacher.subjects?.filter((subjectId: any) =>
          teacherSubjectIds.includes(subjectId)
        ) || [];
        const commonSubjectNames = commonSubjectIds
          .map((id: any) => subjectMap.get(id))
          .filter(Boolean);

        return {
          ...replacementTeacher,
          commonSubjectIds,
          commonSubjectNames,
        };
      });
  }, [allTeachers, teacher._id, teacher.subjects, subjectMap]);

  // Filter replacement teachers by selected subject
  const filteredReplacementTeachers = useMemo(() => {
    if (!filterSubjectId) {
      return replacementTeachersData;
    }
    return replacementTeachersData.filter((rt: any) =>
      rt.commonSubjectIds.includes(filterSubjectId)
    );
  }, [replacementTeachersData, filterSubjectId]);


  return (
    <div className="space-y-4">
      {/* Total Lectures Per Week */}
      <Card className="p-5 border-gray-200/80 bg-gradient-to-br from-white to-blue-50/30 shadow-md hover:shadow-lg transition-all duration-300 card-hover">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 p-2.5 shadow-md shadow-blue-500/30">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Lectures Per Week</h3>
            <p className="text-xs text-gray-500">Total recurring lectures</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{totalLecturesPerWeek}</p>
          <p className="text-xs text-gray-500 mt-2">
            {totalLecturesPerWeek === 1 ? "lecture" : "lectures"} scheduled weekly
          </p>
        </div>
      </Card>

      {/* Available Replacement Teachers */}
      <Card className="p-5 border-gray-200/80 bg-gradient-to-br from-white to-green-50/30 shadow-md hover:shadow-lg transition-all duration-300 card-hover">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-2.5 shadow-md shadow-green-500/30">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Available Replacements</h3>
              <p className="text-xs text-gray-500">Teachers with same subjects</p>
            </div>
          </div>
        </div>
        
        {/* Filter by Subject */}
        {teacherSubjects.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Filter by Subject
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterSubjectId}
                onChange={(e) => setFilterSubjectId(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-xs rounded-lg border border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-1 hover:border-gray-400 transition-all"
              >
                <option value="">All Subjects</option>
                {teacherSubjects.map((subject: any) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {filteredReplacementTeachers.length > 0 ? (
          <div className="space-y-3">
            {filteredReplacementTeachers.map((rt: any) => (
              <ReplacementTeacherCard
                key={rt._id}
                replacementTeacher={rt}
                periods={periods}
                academicYear={academicYear}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              {filterSubjectId
                ? "No replacement teachers available for selected subject"
                : "No replacement teachers available"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {filterSubjectId
                ? "Try selecting a different subject or clear the filter"
                : "No other teachers share the same subjects"}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
