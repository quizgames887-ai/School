"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner, Skeleton } from "@/components/ui/loading";
import { Calendar, Plus, Edit2, Trash2, Clock } from "lucide-react";
import { toast } from "@/components/ui/toast";

export default function ClassSessionsPage() {
  const classSessions = useQuery(api.queries.classSessions.getAll);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);

  const deleteSession = useMutation(api.mutations.classSessions.deleteClassSession);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Sessions</h1>
          <p className="mt-1 text-sm text-gray-600">Manage scheduled class sessions</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Class Session
        </Button>
      </div>

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

      {classSessions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No class sessions</h3>
            <p className="mt-2 text-sm text-gray-600">
              Get started by creating a new class session.
            </p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Class Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classSessions.map((session: any) => (
            <Card key={session._id} className="transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <span className="text-lg">{session.curriculumName}</span>
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Section:</strong> {session.sectionName} ({session.sectionGrade})</p>
                    <p><strong>Teacher:</strong> {session.teacherName}</p>
                    <p><strong>Date:</strong> {new Date(session.date).toLocaleDateString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4" />
                      <span>{session.time} - {session.endTime || "N/A"}</span>
                    </div>
                    {session.periodName && (
                      <p className="text-xs text-gray-500">Period: {session.periodName}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingSession(session._id);
                      setShowForm(true);
                    }}
                    className="flex-1"
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
              </CardContent>
            </Card>
          ))}
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
    const period = periods?.find((p: any) => p._id === selectedPeriodId);
    if (period && !period.isBreak) {
      setTime(period.startTime);
      setEndTime(period.endTime);
    }
  };

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
                Curriculum <span className="text-red-500">*</span>
              </label>
              <select
                value={curriculumId}
                onChange={(e) => setCurriculumId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select curriculum</option>
                {subjects.map((subject: any) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
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
              {periodId && (
                <p className="mt-1 text-xs text-gray-500">
                  Time will be set automatically from period
                </p>
              )}
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
