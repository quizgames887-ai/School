"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner, Skeleton } from "@/components/ui/loading";
import { Calendar, Plus, Edit2, Trash2, Clock, Filter, RefreshCw, Zap, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { toast } from "@/components/ui/toast";

// Day names for the weekly view
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ClassSessionsPage() {
  const classSessions = useQuery(api.queries.classSessions.getAll);
  const teachers = useQuery(api.queries.teachers.getAll);
  const subjects = useQuery(api.queries.subjects.getAll);
  const sections = useQuery(api.queries.sections.getAll);
  const periods = useQuery(api.queries.periods.getByAcademicYear, { academicYear: "2025-2026" });
  const lectures = useQuery(api.queries.lectures.getAll);
  
  const [showForm, setShowForm] = useState(false);
  const [showSyncForm, setShowSyncForm] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  // Count recurring lectures for the sync indicator
  const recurringLecturesCount = useMemo(() => {
    if (!lectures) return 0;
    return lectures.filter((l: any) => l.recurring).length;
  }, [lectures]);

  // Check for unsynced lectures
  const unsyncedInfo = useQuery(
    api.queries.classSessions.getUnsyncedLecturesCount,
    { academicYear: "2025-2026" }
  );

  const deleteSession = useMutation(api.mutations.classSessions.deleteClassSession);

  // Get sections grouped by grade
  const sectionsByGrade = useMemo(() => {
    if (!sections) return {};
    const grouped: Record<string, any[]> = {};
    sections.forEach((section: any) => {
      const grade = section.grade || "Unknown";
      if (!grouped[grade]) {
        grouped[grade] = [];
      }
      grouped[grade].push(section);
    });
    return grouped;
  }, [sections]);

  // Get week dates
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeekStart]);

  // Format date as ISO string (YYYY-MM-DD)
  const formatDateISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Get sessions for the selected section and current week
  const weekSessions = useMemo(() => {
    if (!classSessions || !selectedSection) return {};
    
    const sessionsMap: Record<string, Record<string, any[]>> = {}; // periodId -> dayIndex -> sessions
    
    const filteredSessions = classSessions.filter((s: any) => s.sectionId === selectedSection);
    
    // #region agent log
    console.log('[DEBUG weekSessions]', {selectedSection,totalSessions:classSessions?.length,filteredCount:filteredSessions.length,sampleSession:filteredSessions[0]});
    // #endregion
    
    filteredSessions.forEach((session: any) => {
        const sessionDate = new Date(session.date);
        const dayIndex = sessionDate.getDay();
        
        // Check if session is in current week
        const weekStart = new Date(currentWeekStart);
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const isInWeek = sessionDate >= weekStart && sessionDate <= weekEnd;
        
        // #region agent log
        console.log('[DEBUG weekCheck]', {sessionDate:session.date,dayIndex,weekStart:formatDateISO(weekStart),weekEnd:formatDateISO(weekEnd),isInWeek,periodId:session.periodId,time:session.time});
        // #endregion
        
        if (isInWeek) {
          const periodKey = session.periodId || session.time;
          if (!sessionsMap[periodKey]) {
            sessionsMap[periodKey] = {};
          }
          if (!sessionsMap[periodKey][dayIndex]) {
            sessionsMap[periodKey][dayIndex] = [];
          }
          sessionsMap[periodKey][dayIndex].push(session);
        }
      });
    
    // #region agent log
    console.log('[DEBUG weekSessionsResult]', {mapKeys:Object.keys(sessionsMap),currentWeekStart:formatDateISO(currentWeekStart)});
    // #endregion
    
    return sessionsMap;
  }, [classSessions, selectedSection, currentWeekStart]);

  // Get sorted periods (non-break only)
  const sortedPeriods = useMemo(() => {
    if (!periods) return [];
    const sorted = periods
      .filter((p: any) => !p.isBreak)
      .sort((a: any, b: any) => a.order - b.order);
    
    // #region agent log
    console.log('[DEBUG sortedPeriods]', {periodIds:sorted.map((p:any)=>p._id),periodNames:sorted.map((p:any)=>p.name)});
    // #endregion
    
    return sorted;
  }, [periods]);

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Delete this class session?")) return;
    try {
      await deleteSession({ id: sessionId as any });
      toast("Class session deleted", "success");
    } catch (error: any) {
      toast(`Error: ${error.message || error}`, "error");
    }
  };

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    setCurrentWeekStart(start);
  };

  // Get selected section details
  const selectedSectionData = sections?.find((s: any) => s._id === selectedSection);

  if (classSessions instanceof Error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-red-600">Error Loading Class Sessions</h2>
            <p className="mt-2 text-gray-600">{classSessions.message || String(classSessions)}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!classSessions || !sections || !periods) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Sessions</h1>
          <p className="mt-1 text-sm text-gray-600">Weekly timetable per section</p>
        </div>
        <div className="flex gap-2">
          {recurringLecturesCount > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setShowSyncForm(true)}
              className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:border-purple-300"
            >
              <Zap className="mr-2 h-4 w-4 text-purple-600" />
              Sync from Schedules
            </Button>
          )}
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Session
          </Button>
        </div>
      </div>

      {/* Sync Banner */}
      {unsyncedInfo && unsyncedInfo.unsyncedCount > 0 && (
        <Card className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                {unsyncedInfo.unsyncedCount} sessions can be auto-generated from teacher schedules
              </span>
            </div>
            <Button size="sm" onClick={() => setShowSyncForm(true)} className="bg-amber-500 hover:bg-amber-600 text-white">
              <Zap className="mr-1 h-3 w-3" />
              Sync
            </Button>
          </div>
        </Card>
      )}

      {/* Section Selector */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Select Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">-- Choose a section --</option>
              {Object.keys(sectionsByGrade).sort().map((grade) => (
                <optgroup key={grade} label={grade}>
                  {sectionsByGrade[grade].map((section: any) => (
                    <option key={section._id} value={section._id}>
                      {section.name} ({section.numberOfStudents} students)
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

        </div>
      </Card>

      {/* Timetable */}
      {selectedSection ? (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">
                {selectedSectionData?.grade} - {selectedSectionData?.name}
              </CardTitle>
              <div className="text-sm text-blue-100">
                {selectedSectionData?.numberOfStudents} students
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-b border-r p-3 text-left text-xs font-semibold text-gray-600 w-24">
                      Period
                    </th>
                    {DAY_NAMES.map((day, idx) => (
                      <th 
                        key={idx} 
                        className="border-b p-3 text-center text-xs font-semibold min-w-[120px] text-gray-600"
                      >
                        <div className="font-bold">{day}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedPeriods.map((period: any) => (
                    <tr key={period._id} className="hover:bg-gray-50/50">
                      <td className="border-b border-r p-2 bg-gray-50">
                        <div className="text-sm font-medium text-gray-900">{period.name}</div>
                        <div className="text-xs text-gray-500">{period.startTime}-{period.endTime}</div>
                      </td>
                      {DAY_NAMES.map((_, dayIdx) => {
                        const sessions = weekSessions[period._id]?.[dayIdx] || [];
                        
                        // #region agent log
                        if (dayIdx === 0) console.log('[DEBUG cellRender]', {periodId:period._id,periodName:period.name,foundSessions:sessions.length,weekSessionsKeys:Object.keys(weekSessions)});
                        // #endregion
                        
                        return (
                          <td 
                            key={dayIdx} 
                            className="border-b p-1 align-top"
                          >
                            {sessions.length > 0 ? (
                              sessions.map((session: any) => (
                                <div 
                                  key={session._id}
                                  className="p-2 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 mb-1"
                                >
                                  <div className="text-sm font-semibold text-indigo-900 truncate">
                                    {session.curriculumName}
                                  </div>
                                  <div className="text-xs text-gray-600 truncate">
                                    {session.teacherName}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="h-16 flex items-center justify-center">
                                <span className="text-gray-300 text-xs">-</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Select a Section</h3>
            <p className="mt-2 text-sm text-gray-500">
              Choose a section above to view its weekly timetable
            </p>
            {classSessions.length === 0 && recurringLecturesCount > 0 && (
              <div className="mt-6">
                <Button 
                  onClick={() => setShowSyncForm(true)}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Generate Sessions from Teacher Schedules
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showForm && (
        <ClassSessionForm
          sessionId={editingSession}
          onClose={() => {
            setShowForm(false);
            setEditingSession(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingSession(null);
          }}
        />
      )}

      {showSyncForm && (
        <SyncFromSchedulesForm
          onClose={() => setShowSyncForm(false)}
          onSuccess={() => setShowSyncForm(false)}
          teachersList={teachers || []}
        />
      )}
    </div>
  );
}

function ClassSessionForm({
  sessionId,
  onClose,
  onSuccess,
}: {
  sessionId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [sectionId, setSectionId] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:50");
  const [academicYear] = useState("2025-2026"); // Read-only, always 2025-2026
  const [periodId, setPeriodId] = useState("");

  const createSession = useMutation(api.mutations.classSessions.create);
  const updateSession = useMutation(api.mutations.classSessions.update);
  const sections = useQuery(api.queries.sections.getAll);
  const subjects = useQuery(api.queries.subjects.getAll);
  const teachers = useQuery(api.queries.teachers.getAll);
  const periods = useQuery(
    api.queries.periods.getByAcademicYear,
    { academicYear }
  );
  const existingSession = useQuery(
    api.queries.classSessions.getById,
    sessionId ? { id: sessionId as any } : "skip"
  );

  useEffect(() => {
    if (existingSession) {
      setSectionId(existingSession.sectionId);
      setCurriculumId(existingSession.curriculumId);
      setTeacherId(existingSession.teacherId);
      setDate(existingSession.date);
      setTime(existingSession.time);
      setEndTime(existingSession.endTime || "");
      // Academic year is always 2025-2026, don't override from existing session
      setPeriodId(existingSession.periodId || "");
    } else {
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    }
  }, [existingSession]);

  const handlePeriodChange = (selectedPeriodId: string) => {
    setPeriodId(selectedPeriodId);
    // Period is independent - don't auto-set time
  };

  // Get available subjects (curriculum) - filter by teacher's subjects if teacher is selected
  const teacher = teachers?.find((t: any) => t._id === teacherId);
  const availableSubjects = useMemo(() => {
    if (!subjects) return [];
    if (!teacherId || !teacher) return []; // Return empty when no teacher selected (dropdown is disabled)
    // Filter subjects based on teacher's assigned subjects
    return subjects.filter((subject: any) => 
      teacher.subjects && teacher.subjects.includes(subject._id)
    );
  }, [subjects, teacherId, teacher]);

  // Clear curriculum when teacher changes and the selected curriculum is not available for the new teacher
  useEffect(() => {
    if (teacherId && curriculumId) {
      const isCurriculumAvailable = availableSubjects.some((s: any) => s._id === curriculumId);
      if (!isCurriculumAvailable) {
        setCurriculumId("");
      }
    }
  }, [teacherId, curriculumId, availableSubjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (sessionId) {
        await updateSession({
          id: sessionId as any,
          sectionId: sectionId as any,
          curriculumId: curriculumId as any,
          teacherId: teacherId as any,
          date,
          time,
          endTime: endTime || undefined,
          academicYear,
          periodId: (periodId || undefined) as any,
        });
        toast("Class session updated successfully", "success");
      } else {
        await createSession({
          sectionId: sectionId as any,
          curriculumId: curriculumId as any,
          teacherId: teacherId as any,
          date,
          time,
          endTime: endTime || undefined,
          academicYear,
          periodId: (periodId || undefined) as any,
        });
        toast("Class session created successfully", "success");
      }
      onSuccess();
    } catch (error: any) {
      toast(`Error: ${error.message || error}`, "error");
    }
  };

  if (!sections || !subjects || !teachers) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <LoadingSpinner size="lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-xl">
            {sessionId ? "Edit Class Session" : "Add Class Session"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Section <span className="text-red-500">*</span>
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select section</option>
                {sections.map((section: any) => (
                  <option key={section._id} value={section._id}>
                    {section.name} - {section.grade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teacher <span className="text-red-500">*</span>
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select teacher</option>
                {teachers.map((teacher: any) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Curriculum <span className="text-red-500">*</span>
              </label>
              <select
                value={curriculumId}
                onChange={(e) => setCurriculumId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                ) : subjects === undefined ? (
                  <option disabled>Loading curriculum...</option>
                ) : (
                  <option disabled>No curriculum available{teacherId ? " for this teacher" : " (select a teacher first)"}</option>
                )}
              </select>
              {teacherId && availableSubjects.length === 0 && subjects && (
                <p className="mt-1 text-xs text-amber-600">
                  Note: This teacher is not assigned to any subjects. Go to Admin → Teachers to assign subjects.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Period (Optional)
              </label>
              <select
                value={periodId}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select period (optional)</option>
                {periods
                  ?.filter((p: any) => !p.isBreak)
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((period: any) => (
                    <option key={period._id} value={period._id}>
                      {period.name} ({period.startTime} - {period.endTime})
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    setPeriodId(""); // Clear period when manually editing
                  }}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setPeriodId(""); // Clear period when manually editing
                  }}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={academicYear}
                readOnly
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 shadow-sm cursor-not-allowed"
                placeholder="2025-2026"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">
                {sessionId ? "Update Session" : "Create Session"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SyncFromSchedulesForm({
  onClose,
  onSuccess,
  teachersList,
}: {
  onClose: () => void;
  onSuccess: () => void;
  teachersList: any[];
}) {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().split("T")[0];
  });
  const [academicYear] = useState("2025-2026");
  const [teacherId, setTeacherId] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ created: number; skipped: number } | null>(null);

  const syncFromSchedules = useMutation(api.mutations.classSessions.syncFromTeacherSchedules);
  const clearAutoGenerated = useMutation(api.mutations.classSessions.clearAutoGenerated);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncFromSchedules({
        startDate,
        endDate,
        academicYear,
        teacherId: teacherId ? (teacherId as any) : undefined,
      });
      setSyncResult(result);
      toast(`${result.message}`, "success");
      if (result.created > 0) {
        onSuccess();
      }
    } catch (error: any) {
      toast(`Error: ${error.message || error}`, "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear all auto-generated class sessions in this date range? This will only remove sessions marked as recurring.")) {
      return;
    }
    setIsSyncing(true);
    try {
      const result = await clearAutoGenerated({
        startDate,
        endDate,
        academicYear,
        teacherId: teacherId ? (teacherId as any) : undefined,
      });
      toast(`${result.message}`, "success");
    } catch (error: any) {
      toast(`Error: ${error.message || error}`, "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate date range info
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
  const weeksCount = Math.ceil(daysDiff / 7);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
          <CardTitle className="text-xl flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Sync Class Sessions from Teacher Schedules
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Automatically generate class sessions based on recurring teacher schedules (lectures). 
            This will create individual class session entries for each scheduled day within the selected date range.
          </p>

          <form onSubmit={handleSync} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            {daysDiff > 0 && (
              <div className="bg-purple-50 rounded-lg p-3 text-sm">
                <p className="text-purple-800">
                  <span className="font-medium">{daysDiff} days</span> selected ({weeksCount} week{weeksCount !== 1 ? "s" : ""})
                </p>
                <p className="text-purple-600 text-xs mt-1">
                  Sessions will be created for each recurring schedule within this range.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teacher (Optional)
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Teachers</option>
                {teachersList.map((teacher: any) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to sync sessions for all teachers, or select a specific teacher.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Academic Year
              </label>
              <input
                type="text"
                value={academicYear}
                readOnly
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 shadow-sm cursor-not-allowed"
              />
            </div>

            {syncResult && (
              <div className={`rounded-lg p-4 ${syncResult.created > 0 ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
                <p className={`font-medium ${syncResult.created > 0 ? "text-green-800" : "text-yellow-800"}`}>
                  {syncResult.created > 0 ? "✓ Sync Complete" : "No New Sessions Created"}
                </p>
                <p className={`text-sm mt-1 ${syncResult.created > 0 ? "text-green-700" : "text-yellow-700"}`}>
                  Created: {syncResult.created} sessions | Skipped: {syncResult.skipped} (already exist or invalid)
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                disabled={isSyncing || daysDiff <= 0}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Sessions
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-xs text-gray-500 mb-2">
                Need to re-sync? Clear existing auto-generated sessions first:
              </p>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleClear}
                disabled={isSyncing}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Clear Auto-Generated Sessions in Range
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
