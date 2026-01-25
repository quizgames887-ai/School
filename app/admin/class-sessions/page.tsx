"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner, Skeleton } from "@/components/ui/loading";
import { Calendar, Plus, Edit2, Trash2, Clock, Filter, RefreshCw, Zap } from "lucide-react";
import { toast } from "@/components/ui/toast";

export default function ClassSessionsPage() {
  const classSessions = useQuery(api.queries.classSessions.getAll);
  const teachers = useQuery(api.queries.teachers.getAll);
  const subjects = useQuery(api.queries.subjects.getAll);
  const lectures = useQuery(api.queries.lectures.getAll);
  const [showForm, setShowForm] = useState(false);
  const [showSyncForm, setShowSyncForm] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [filterGrade, setFilterGrade] = useState<string>("");
  const [filterTeacher, setFilterTeacher] = useState<string>("");
  const [filterCurriculum, setFilterCurriculum] = useState<string>("");

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

  // Group sessions by grade - must be called before any conditional returns
  const sessionsByGrade = useMemo(() => {
    if (!classSessions || classSessions instanceof Error) return {};
    
    // Apply filters first
    let filteredSessions = classSessions;
    
    if (filterGrade) {
      filteredSessions = filteredSessions.filter((s: any) => s.sectionGrade === filterGrade);
    }
    
    if (filterTeacher) {
      filteredSessions = filteredSessions.filter((s: any) => s.teacherId === filterTeacher);
    }
    
    if (filterCurriculum) {
      filteredSessions = filteredSessions.filter((s: any) => s.curriculumId === filterCurriculum);
    }
    
    const grouped: Record<string, any[]> = {};
    filteredSessions.forEach((session: any) => {
      const grade = session.sectionGrade || "Unknown";
      if (!grouped[grade]) {
        grouped[grade] = [];
      }
      grouped[grade].push(session);
    });
    
    // Sort sessions within each grade by date and time
    Object.keys(grouped).forEach((grade) => {
      grouped[grade].sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
    });
    
    return grouped;
  }, [classSessions, filterGrade, filterTeacher, filterCurriculum]);

  // Get unique values for filters
  const allGrades = useMemo(() => {
    if (!classSessions) return [];
    const gradeSet = new Set<string>();
    classSessions.forEach((session: any) => {
      if (session.sectionGrade) gradeSet.add(session.sectionGrade);
    });
    return Array.from(gradeSet).sort();
  }, [classSessions]);

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this class session? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteSession({ id: sessionId as any });
      toast("Class session deleted successfully", "success");
    } catch (error: any) {
      toast(`Error: ${error.message || error}`, "error");
    }
  };

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

  if (!classSessions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const grades = Object.keys(sessionsByGrade).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Sessions</h1>
          <p className="mt-1 text-sm text-gray-600">Manage scheduled class sessions</p>
        </div>
        <div className="flex gap-2">
          {recurringLecturesCount > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setShowSyncForm(true)}
              className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:border-purple-300 hover:from-purple-100 hover:to-indigo-100"
            >
              <Zap className="mr-2 h-4 w-4 text-purple-600" />
              Sync from Schedules
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                {recurringLecturesCount}
              </span>
            </Button>
          )}
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Class Session
          </Button>
        </div>
      </div>

      {/* Filters */}
      {(allGrades.length > 0 || (teachers && teachers.length > 0) || (subjects && subjects.length > 0)) && (
        <Card className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50">
          <div className="flex flex-wrap gap-4 items-end">
            {allGrades.length > 0 && (
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  <Filter className="inline h-3.5 w-3.5 mr-1" />
                  Filter by Grade
                </label>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-400"
                >
                  <option value="">All Grades</option>
                  {allGrades.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {teachers && teachers.length > 0 && (
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  <Filter className="inline h-3.5 w-3.5 mr-1" />
                  Filter by Teacher
                </label>
                <select
                  value={filterTeacher}
                  onChange={(e) => setFilterTeacher(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-400"
                >
                  <option value="">All Teachers</option>
                  {teachers.map((teacher: any) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {subjects && subjects.length > 0 && (
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  <Filter className="inline h-3.5 w-3.5 mr-1" />
                  Filter by Curriculum
                </label>
                <select
                  value={filterCurriculum}
                  onChange={(e) => setFilterCurriculum(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-400"
                >
                  <option value="">All Curriculums</option>
                  {subjects.map((subject: any) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(filterGrade || filterTeacher || filterCurriculum) && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilterGrade("");
                  setFilterTeacher("");
                  setFilterCurriculum("");
                }}
                className="h-10"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Unsynced Lectures Banner */}
      {unsyncedInfo && unsyncedInfo.unsyncedCount > 0 && (
        <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <RefreshCw className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-800">
                  {unsyncedInfo.unsyncedCount} class session{unsyncedInfo.unsyncedCount !== 1 ? "s" : ""} can be auto-generated
                </p>
                <p className="text-sm text-amber-600">
                  Based on your teacher schedules for this week
                  {unsyncedInfo.nextSyncDate && ` (starting ${new Date(unsyncedInfo.nextSyncDate).toLocaleDateString()})`}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowSyncForm(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Zap className="mr-2 h-4 w-4" />
              Sync Now
            </Button>
          </div>
        </Card>
      )}

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

      {classSessions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No class sessions</h3>
            <p className="mt-2 text-sm text-gray-600">
              Get started by creating a new class session.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              {recurringLecturesCount > 0 && (
                <Button 
                  variant="default"
                  onClick={() => setShowSyncForm(true)}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Auto-Generate from Teacher Schedules
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full">
                    {recurringLecturesCount} schedules
                  </span>
                </Button>
              )}
              <Button variant={recurringLecturesCount > 0 ? "outline" : "default"} onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Class Session Manually
              </Button>
            </div>
            {recurringLecturesCount > 0 && (
              <p className="mt-4 text-xs text-gray-500">
                You have {recurringLecturesCount} recurring teacher schedule{recurringLecturesCount !== 1 ? "s" : ""} configured. 
                Use &quot;Auto-Generate&quot; to create class sessions based on these schedules.
              </p>
            )}
            {recurringLecturesCount === 0 && (
              <p className="mt-4 text-xs text-gray-500">
                Tip: Set up teacher schedules in the Schedule page first, then use &quot;Sync from Schedules&quot; to auto-generate class sessions.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {grades.length > 0 ? (
            grades.map((grade) => (
              <Card key={grade} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {grade}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Curriculum
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Section
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Teacher
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Period
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sessionsByGrade[grade].map((session: any) => (
                        <tr key={session._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                                <Calendar className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {session.curriculumName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {session.sectionName}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {session.teacherName}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {new Date(session.date).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {session.time} - {session.endTime || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {session.periodName || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingSession(session._id);
                                  setShowForm(true);
                                }}
                              >
                                <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(session._id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-sm text-gray-500">No class sessions found matching the selected filters.</p>
              </CardContent>
            </Card>
          )}
        </div>
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
