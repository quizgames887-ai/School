"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner, Skeleton } from "@/components/ui/loading";
import { toast } from "@/components/ui/toast";
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Settings,
  Users,
  ClipboardList,
  Download,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekStartDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function getWeekDates(weekStart: string): string[] {
  const start = new Date(weekStart);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default function DutyRosterPage() {
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [activeSection, setActiveSection] = useState<"config" | "profiles" | "roster">("config");
  const [weekStartDate, setWeekStartDate] = useState(() =>
    getWeekStartDate(new Date())
  );

  const config = useQuery(api.queries.dutyConfig.getByAcademicYear, {
    academicYear,
  });
  const dutyTypes = useQuery(api.queries.dutyTypes.getByAcademicYear, {
    academicYear,
  });
  const teachers = useQuery(api.queries.teachers.getAll, {});
  const profiles = useQuery(api.queries.teacherDutyProfiles.getByAcademicYear, {
    academicYear,
  });
  const assignments = useQuery(api.queries.dutyAssignments.getByWeekStart, {
    weekStartDate,
    academicYear,
  });

  const [workingDays, setWorkingDays] = useState<number[]>([]);
  useEffect(() => {
    if (config?.workingDays?.length) {
      setWorkingDays(config.workingDays);
    }
  }, [config?.workingDays]);

  const upsertConfig = useMutation(api.mutations.dutyConfig.upsert);
  const createDutyType = useMutation(api.mutations.dutyTypes.create);
  const updateDutyType = useMutation(api.mutations.dutyTypes.update);
  const removeDutyType = useMutation(api.mutations.dutyTypes.remove);
  const generateRoster = useAction(api.actions.generateDutyRoster.generateDutyRoster);
  const updateAssignment = useMutation(api.mutations.dutyAssignments.updateAssignment);

  const handleSaveConfig = async () => {
    try {
      await upsertConfig({
        academicYear,
        workingDays: workingDays.length ? workingDays : [0, 1, 2, 3, 4],
      });
      toast("Configuration saved", "success");
    } catch (e) {
      toast(String(e), "error");
    }
  };

  const handleGenerate = async () => {
    try {
      await generateRoster({ academicYear, weekStartDate });
      toast("Roster generated", "success");
    } catch (e) {
      toast(String(e), "error");
    }
  };

  const weekDates = useMemo(() => getWeekDates(weekStartDate), [weekStartDate]);
  const configWorkingDays = config?.workingDays ?? [];

  if (teachers === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Duty Roster</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure working days, duty types, teacher profiles, and generate the weekly roster
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium"
          >
            <option value="2025-2026">2025-2026</option>
          </select>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSection("config")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeSection === "config"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Settings className="h-4 w-4" />
          Configuration
        </button>
        <button
          onClick={() => setActiveSection("profiles")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeSection === "profiles"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Users className="h-4 w-4" />
          Teacher Profiles
        </button>
        <button
          onClick={() => setActiveSection("roster")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeSection === "roster"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Roster
        </button>
      </div>

      {/* Configuration */}
      {activeSection === "config" && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <p className="text-sm text-gray-500">
              Set school working days and define duty types with required teachers per slot.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working days
              </label>
              <div className="flex flex-wrap gap-4">
                {DAY_NAMES.map((name, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={workingDays.includes(i)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWorkingDays([...workingDays, i].sort((a, b) => a - b));
                        } else {
                          setWorkingDays(workingDays.filter((d) => d !== i));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm">{name}</span>
                  </label>
                ))}
              </div>
              <Button className="mt-4" onClick={handleSaveConfig}>
                Save configuration
              </Button>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Duty types</h3>
              {dutyTypes === undefined ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <DutyTypesList
                    dutyTypes={dutyTypes}
                    academicYear={academicYear}
                    onUpdate={updateDutyType}
                    onRemove={removeDutyType}
                    onCreate={createDutyType}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teacher profiles */}
      {activeSection === "profiles" && (
        <TeacherProfilesSection
          academicYear={academicYear}
          teachers={teachers}
          profiles={profiles ?? []}
          dutyTypes={dutyTypes ?? []}
        />
      )}

      {/* Roster */}
      {activeSection === "roster" && (
        <RosterSection
          academicYear={academicYear}
          weekStartDate={weekStartDate}
          setWeekStartDate={setWeekStartDate}
          weekDates={weekDates}
          dutyTypes={dutyTypes ?? []}
          assignments={assignments ?? []}
          teachers={teachers}
          configWorkingDays={configWorkingDays}
          onGenerate={handleGenerate}
          onUpdateAssignment={updateAssignment}
        />
      )}
    </div>
  );
}

function DutyTypesList({
  dutyTypes,
  academicYear,
  onUpdate,
  onRemove,
  onCreate,
}: {
  dutyTypes: { _id: Id<"dutyTypes">; name: string; requiredTeachers: number; order: number }[];
  academicYear: string;
  onUpdate: (args: {
    id: Id<"dutyTypes">;
    name?: string;
    requiredTeachers?: number;
    order?: number;
  }) => Promise<unknown>;
  onRemove: (args: { id: Id<"dutyTypes"> }) => Promise<unknown>;
  onCreate: (args: {
    name: string;
    requiredTeachers: number;
    academicYear: string;
    order: number;
  }) => Promise<Id<"dutyTypes">>;
}) {
  const [editingId, setEditingId] = useState<Id<"dutyTypes"> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRequired, setNewRequired] = useState(2);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await onCreate({
        name: newName.trim(),
        requiredTeachers: newRequired,
        academicYear,
        order: dutyTypes.length + 1,
      });
      setNewName("");
      setNewRequired(2);
      setShowForm(false);
    } catch (e) {
      toast(String(e), "error");
    }
  };

  return (
    <div className="space-y-2">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Name
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Required teachers
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {dutyTypes.map((dt) => (
            <tr key={dt._id}>
              <td className="px-4 py-2 text-sm">{dt.name}</td>
              <td className="px-4 py-2 text-sm">{dt.requiredTeachers}</td>
              <td className="px-4 py-2 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(dt._id)}
                  className="mr-2"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    if (confirm("Remove this duty type?")) {
                      await onRemove({ id: dt._id });
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showForm ? (
        <div className="flex gap-2 items-center p-2 bg-gray-50 rounded-lg">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Duty name"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <input
            type="number"
            min={1}
            value={newRequired}
            onChange={(e) => setNewRequired(parseInt(e.target.value, 10) || 1)}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <Button size="sm" onClick={handleCreate}>
            Add
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add duty type
        </Button>
      )}
      {editingId && (
        <DutyTypeEditModal
          dutyType={dutyTypes.find((d) => d._id === editingId)!}
          onClose={() => setEditingId(null)}
          onSave={async (updates) => {
            await onUpdate({ id: editingId, ...updates });
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

function DutyTypeEditModal({
  dutyType,
  onClose,
  onSave,
}: {
  dutyType: { _id: Id<"dutyTypes">; name: string; requiredTeachers: number };
  onClose: () => void;
  onSave: (u: { name?: string; requiredTeachers?: number }) => Promise<void>;
}) {
  const [name, setName] = useState(dutyType.name);
  const [required, setRequired] = useState(dutyType.requiredTeachers);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Edit duty type</CardTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Required teachers
            </label>
            <input
              type="number"
              min={1}
              value={required}
              onChange={(e) => setRequired(parseInt(e.target.value, 10) || 1)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onSave({ name, requiredTeachers: required })}>
              Save
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TeacherProfilesSection({
  academicYear,
  teachers,
  profiles,
  dutyTypes,
}: {
  academicYear: string;
  teachers: { _id: Id<"teachers">; name: string; email: string }[];
  profiles: {
    _id: Id<"teacherDutyProfiles">;
    teacherId: Id<"teachers">;
    availableDays: number[];
    maxDutiesPerWeek: number;
    maxDutiesPerDay: number;
    teachingLoadOverride?: number;
    excludeDays?: number[];
    excludeDutyTypeIds?: Id<"dutyTypes">[];
  }[];
  dutyTypes: { _id: Id<"dutyTypes">; name: string }[];
}) {
  const [editingTeacherId, setEditingTeacherId] = useState<Id<"teachers"> | null>(null);
  const profileByTeacher = useMemo(() => {
    const m = new Map<string, (typeof profiles)[0]>();
    for (const p of profiles) m.set(p.teacherId, p);
    return m;
  }, [profiles]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher duty profiles</CardTitle>
        <p className="text-sm text-gray-500">
          Set availability, max duties per week/day, and restrictions per teacher. Empty availability means all working days.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Teacher
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Max/week
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Max/day
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.map((t) => {
                const p = profileByTeacher.get(t._id);
                return (
                  <tr key={t._id}>
                    <td className="px-4 py-2 text-sm font-medium">{t.name}</td>
                    <td className="px-4 py-2 text-sm">{p?.maxDutiesPerWeek ?? "—"}</td>
                    <td className="px-4 py-2 text-sm">{p?.maxDutiesPerDay ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTeacherId(t._id)}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {editingTeacherId && (
          <TeacherProfileModal
            teacher={teachers.find((t) => t._id === editingTeacherId)!}
            profile={profileByTeacher.get(editingTeacherId)}
            academicYear={academicYear}
            dutyTypes={dutyTypes}
            onClose={() => setEditingTeacherId(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}

function TeacherProfileModal({
  teacher,
  profile,
  academicYear,
  dutyTypes,
  onClose,
}: {
  teacher: { _id: Id<"teachers">; name: string };
  profile?: {
    availableDays: number[];
    maxDutiesPerWeek: number;
    maxDutiesPerDay: number;
    teachingLoadOverride?: number;
    excludeDays?: number[];
    excludeDutyTypeIds?: Id<"dutyTypes">[];
  };
  academicYear: string;
  dutyTypes: { _id: Id<"dutyTypes">; name: string }[];
  onClose: () => void;
}) {
  const upsertProfile = useMutation(api.mutations.teacherDutyProfiles.upsert);
  const [availableDays, setAvailableDays] = useState<number[]>(profile?.availableDays ?? []);
  const [maxDutiesPerWeek, setMaxDutiesPerWeek] = useState(
    profile?.maxDutiesPerWeek ?? 3
  );
  const [maxDutiesPerDay, setMaxDutiesPerDay] = useState(
    profile?.maxDutiesPerDay ?? 1
  );
  const [teachingLoadOverride, setTeachingLoadOverride] = useState<string>(
    profile?.teachingLoadOverride !== undefined ? String(profile.teachingLoadOverride) : ""
  );
  const [excludeDays, setExcludeDays] = useState<number[]>(profile?.excludeDays ?? []);
  const [excludeDutyTypeIds, setExcludeDutyTypeIds] = useState<Id<"dutyTypes">[]>(
    profile?.excludeDutyTypeIds ?? []
  );

  const toggleDay = (day: number, list: number[], setList: (l: number[]) => void) => {
    if (list.includes(day)) setList(list.filter((d) => d !== day));
    else setList([...list, day].sort((a, b) => a - b));
  };

  const toggleDutyType = (id: Id<"dutyTypes">) => {
    if (excludeDutyTypeIds.includes(id)) {
      setExcludeDutyTypeIds(excludeDutyTypeIds.filter((x) => x !== id));
    } else {
      setExcludeDutyTypeIds([...excludeDutyTypeIds, id]);
    }
  };

  const handleSave = async () => {
    try {
      await upsertProfile({
        teacherId: teacher._id,
        academicYear,
        teachingLoadOverride:
          teachingLoadOverride === "" ? undefined : parseInt(teachingLoadOverride, 10),
        availableDays,
        maxDutiesPerWeek,
        maxDutiesPerDay,
        excludeDays: excludeDays.length ? excludeDays : undefined,
        excludeDutyTypeIds: excludeDutyTypeIds.length ? excludeDutyTypeIds : undefined,
      });
      toast("Profile saved", "success");
      onClose();
    } catch (e) {
      toast(String(e), "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Duty profile: {teacher.name}</CardTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Available days (empty = all working days)
            </label>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((name, i) => (
                <label key={i} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={availableDays.includes(i)}
                    onChange={() => toggleDay(i, availableDays, setAvailableDays)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm">{name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max duties per week
              </label>
              <input
                type="number"
                min={0}
                value={maxDutiesPerWeek}
                onChange={(e) => setMaxDutiesPerWeek(parseInt(e.target.value, 10) || 0)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max duties per day
              </label>
              <input
                type="number"
                min={0}
                value={maxDutiesPerDay}
                onChange={(e) => setMaxDutiesPerDay(parseInt(e.target.value, 10) || 0)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teaching load override (optional; leave blank to use lecture count)
            </label>
            <input
              type="number"
              min={0}
              value={teachingLoadOverride}
              onChange={(e) => setTeachingLoadOverride(e.target.value)}
              placeholder="From lectures"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exclude days
            </label>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((name, i) => (
                <label key={i} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={excludeDays.includes(i)}
                    onChange={() => toggleDay(i, excludeDays, setExcludeDays)}
                    className="h-4 w-4 rounded border-gray-300 text-red-600"
                  />
                  <span className="text-sm">{name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exclude duty types
            </label>
            <div className="flex flex-wrap gap-2">
              {dutyTypes.map((dt) => (
                <label key={dt._id} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={excludeDutyTypeIds.includes(dt._id)}
                    onChange={() => toggleDutyType(dt._id)}
                    className="h-4 w-4 rounded border-gray-300 text-red-600"
                  />
                  <span className="text-sm">{dt.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save</Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RosterSection({
  academicYear,
  weekStartDate,
  setWeekStartDate,
  weekDates,
  dutyTypes,
  assignments,
  teachers,
  configWorkingDays,
  onGenerate,
  onUpdateAssignment,
}: {
  academicYear: string;
  weekStartDate: string;
  setWeekStartDate: (d: string) => void;
  weekDates: string[];
  dutyTypes: { _id: Id<"dutyTypes">; name: string; requiredTeachers: number }[];
  assignments: {
    _id: Id<"dutyAssignments">;
    teacherId: Id<"teachers">;
    dutyTypeId: Id<"dutyTypes">;
    date: string;
  }[];
  teachers: { _id: Id<"teachers">; name: string }[];
  configWorkingDays: number[];
  onGenerate: () => Promise<void>;
  onUpdateAssignment: (args: {
    id: Id<"dutyAssignments">;
    teacherId: Id<"teachers">;
  }) => Promise<unknown>;
}) {
  const teacherById = useMemo(() => {
    const m = new Map<string, { name: string }>();
    teachers.forEach((t) => m.set(t._id, t));
    return m;
  }, [teachers]);

  const assignmentsByDateAndType = useMemo(() => {
    const m = new Map<string, { id: Id<"dutyAssignments">; teacherId: Id<"teachers"> }[]>();
    for (const a of assignments) {
      const key = `${a.date}-${a.dutyTypeId}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push({ id: a._id, teacherId: a.teacherId });
    }
    return m;
  }, [assignments]);

  const [generating, setGenerating] = useState(false);
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerate();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Weekly roster</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Select week and generate or edit assignments.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Week start</label>
            <input
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? <LoadingSpinner size="sm" /> : "Generate / Regenerate"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                {dutyTypes.map((dt) => (
                  <th
                    key={dt._id}
                    className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {dt.name} ({dt.requiredTeachers})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekDates.map((dateStr) => {
                const d = new Date(dateStr);
                const dayOfWeek = d.getDay();
                const isWorking = configWorkingDays.includes(dayOfWeek);
                return (
                  <tr key={dateStr} className={!isWorking ? "bg-gray-100" : ""}>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {dateStr} ({DAY_NAMES[dayOfWeek]})
                      {!isWorking && " (off)"}
                    </td>
                    {dutyTypes.map((dt) => {
                      const key = `${dateStr}-${dt._id}`;
                      const list = assignmentsByDateAndType.get(key) ?? [];
                      return (
                        <td
                          key={dt._id}
                          className="border border-gray-200 px-3 py-2 text-sm align-top"
                        >
                          {list.map((item, idx) => (
                            <AssignmentCell
                              key={item.id}
                              assignmentId={item.id}
                              currentTeacherId={item.teacherId}
                              teachers={teachers}
                              teacherById={teacherById}
                              onUpdate={onUpdateAssignment}
                            />
                          ))}
                          {list.length === 0 && isWorking && (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex gap-2">
          <ExportButtons
            weekDates={weekDates}
            dutyTypes={dutyTypes}
            assignmentsByDateAndType={assignmentsByDateAndType}
            teacherById={teacherById}
            configWorkingDays={configWorkingDays}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function AssignmentCell({
  assignmentId,
  currentTeacherId,
  teachers,
  teacherById,
  onUpdate,
}: {
  assignmentId: Id<"dutyAssignments">;
  currentTeacherId: Id<"teachers">;
  teachers: { _id: Id<"teachers">; name: string }[];
  teacherById: Map<string, { name: string }>;
  onUpdate: (args: {
    id: Id<"dutyAssignments">;
    teacherId: Id<"teachers">;
  }) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const currentName = teacherById.get(currentTeacherId)?.name ?? "—";
  if (editing) {
    return (
      <select
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        defaultValue={currentTeacherId}
        onBlur={(e) => {
          const newId = e.target.value as Id<"teachers">;
          if (newId !== currentTeacherId) {
            onUpdate({ id: assignmentId, teacherId: newId });
          }
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLSelectElement).blur();
        }}
        autoFocus
      >
        {teachers.map((t) => (
          <option key={t._id} value={t._id}>
            {t.name}
          </option>
        ))}
      </select>
    );
  }
  return (
    <div
      className="cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 -mx-1 -my-0.5"
      onClick={() => setEditing(true)}
      title="Click to change"
    >
      {currentName}
    </div>
  );
}

function ExportButtons({
  weekDates,
  dutyTypes,
  assignmentsByDateAndType,
  teacherById,
  configWorkingDays,
}: {
  weekDates: string[];
  dutyTypes: { _id: Id<"dutyTypes">; name: string; requiredTeachers: number }[];
  assignmentsByDateAndType: Map<
    string,
    { id: Id<"dutyAssignments">; teacherId: Id<"teachers"> }[]
  >;
  teacherById: Map<string, { name: string }>;
  configWorkingDays: number[];
}) {
  const mapForExport = useMemo(() => {
    const m = new Map<string, { id: string; teacherId: string }[]>();
    assignmentsByDateAndType.forEach((list, key) => {
      m.set(key, list.map((a) => ({ id: a.id, teacherId: a.teacherId })));
    });
    return m;
  }, [assignmentsByDateAndType]);
  const dutyTypesForExport = useMemo(
    () => dutyTypes.map((dt) => ({ _id: dt._id, name: dt.name, requiredTeachers: dt.requiredTeachers })),
    [dutyTypes]
  );
  const handleExportExcel = async () => {
    try {
      const { exportDutyRosterToExcel } = await import("@/lib/exportDutyRoster");
      await exportDutyRosterToExcel(
        weekDates,
        dutyTypesForExport,
        mapForExport,
        teacherById,
        configWorkingDays
      );
      toast("Excel exported", "success");
    } catch (e) {
      toast(String(e), "error");
    }
  };
  const handleExportPDF = async () => {
    try {
      const { exportDutyRosterToPDF } = await import("@/lib/exportDutyRoster");
      await exportDutyRosterToPDF(
        weekDates,
        dutyTypesForExport,
        mapForExport,
        teacherById,
        configWorkingDays
      );
      toast("PDF exported", "success");
    } catch (e) {
      toast(String(e), "error");
    }
  };
  return (
    <>
      <Button variant="outline" size="sm" onClick={handleExportExcel}>
        <Download className="h-4 w-4 mr-1" />
        Export Excel
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportPDF}>
        <Download className="h-4 w-4 mr-1" />
        Export PDF
      </Button>
    </>
  );
}
