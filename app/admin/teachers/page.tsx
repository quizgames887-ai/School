"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner, Skeleton } from "@/components/ui/loading";
import { toast } from "@/components/ui/toast";
import { Users, Plus, Edit2, Trash2, Mail } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

export default function TeachersPage() {
  const teachersWithGrades = useQuery(api.queries.teachers.getAllWithGrades, { academicYear: "2025-2026" });
  const subjects = useQuery(api.queries.subjects.getAll);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Group teachers by grade - must be called before any conditional returns
  const teachersByGrade = useMemo(() => {
    if (!teachersWithGrades || teachersWithGrades instanceof Error) return {};
    
    const grouped: Record<string, any[]> = {};
    
    teachersWithGrades.forEach((teacher: any) => {
      // If teacher has grades, add to each grade group
      if (teacher.grades && teacher.grades.length > 0) {
        teacher.grades.forEach((grade: string) => {
          if (!grouped[grade]) {
            grouped[grade] = [];
          }
          // Only add if not already in this grade group (avoid duplicates)
          if (!grouped[grade].find((t: any) => t._id === teacher._id)) {
            grouped[grade].push(teacher);
          }
        });
      } else {
        // Teachers with no grades go to "No Grade Assigned"
        const noGradeKey = "No Grade Assigned";
        if (!grouped[noGradeKey]) {
          grouped[noGradeKey] = [];
        }
        grouped[noGradeKey].push(teacher);
      }
    });
    
    // Sort teachers within each grade by name
    Object.keys(grouped).forEach((grade) => {
      grouped[grade].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return grouped;
  }, [teachersWithGrades]);

  if (!teachersWithGrades || !subjects) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="mt-4 h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const grades = Object.keys(teachersByGrade).sort();
  const totalTeachers = teachersWithGrades.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teachers</h1>
          <p className="mt-1 text-sm text-gray-600">Manage teaching staff and their subjects</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      {showForm && (
        <TeacherForm
          subjects={subjects}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
          }}
        />
      )}

      {totalTeachers === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No teachers found</h3>
            <p className="mt-2 text-sm text-gray-600">
              Get started by adding your first teacher to the system.
            </p>
            <Button className="mt-6" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grades.map((grade) => (
            <Card key={grade}>
              <CardHeader>
                <CardTitle>{grade}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Teacher
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subjects
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teachersByGrade[grade].map((teacher: any) => (
                        <tr key={teacher._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                                <Users className="h-4 w-4" />
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {teacher.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span>{teacher.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {teacher.subjects.length === 0 ? (
                                <span className="text-xs text-gray-500">No subjects assigned</span>
                              ) : (
                                teacher.subjects.map((subjectId: any) => {
                                  const subject = subjects.find((s: Doc<"subjects">) => s._id === subjectId);
                                  return (
                                    <span
                                      key={subjectId}
                                      className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800"
                                    >
                                      {subject?.name || "Unknown"}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(teacher._id)}
                                className="h-8 px-3"
                              >
                                <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <DeleteTeacherButton teacherId={teacher._id} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingId && (
        <TeacherForm
          teacherId={editingId}
          subjects={subjects}
          onClose={() => setEditingId(null)}
          onSuccess={() => {
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

function TeacherForm({
  teacherId,
  subjects,
  onClose,
  onSuccess,
}: {
  teacherId?: string;
  subjects: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const createTeacher = useMutation(api.mutations.teachers.create);
  const updateTeacher = useMutation(api.mutations.teachers.update);
  const teacher = useQuery(
    api.queries.teachers.getById,
    teacherId ? { id: teacherId as any } : "skip"
  );

  useState(() => {
    if (teacher) {
      setName(teacher.name);
      setEmail(teacher.email);
      setSelectedSubjects(teacher.subjects);
    }
  });

  // Update form when teacher data loads
  if (teacher && teacherId && name === "" && email === "") {
    setName(teacher.name);
    setEmail(teacher.email);
    setSelectedSubjects(teacher.subjects);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (teacherId) {
        await updateTeacher({
          id: teacherId as any,
          name,
          email,
          subjects: selectedSubjects as any[],
        });
      } else {
        // For new teachers, we need a userId - this would come from auth
        // For now, we'll skip this in the UI
        toast("Please create teacher through user management first", "warning");
        return;
      }
      toast(teacherId ? "Teacher updated successfully" : "Teacher created successfully", "success");
      onSuccess();
    } catch (error) {
      toast(`Error: ${error}`, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">{teacherId ? "Edit Teacher" : "Add Teacher"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Teacher name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="teacher@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Subjects</label>
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                {subjects.length === 0 ? (
                  <p className="text-sm text-gray-500">No subjects available</p>
                ) : (
                  subjects.map((subject: Doc<"subjects">) => (
                    <label
                      key={subject._id}
                      className="flex cursor-pointer items-center rounded-md p-2 transition-colors hover:bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubjects([...selectedSubjects, subject._id]);
                          } else {
                            setSelectedSubjects(
                              selectedSubjects.filter((id: any) => id !== subject._id)
                            );
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{subject.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">
                {teacherId ? "Update Teacher" : "Create Teacher"}
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

function DeleteTeacherButton({ teacherId }: { teacherId: string }) {
  const deleteTeacher = useMutation(api.mutations.teachers.deleteTeacher);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;
    try {
      await deleteTeacher({ id: teacherId as any });
      toast("Teacher deleted successfully", "success");
    } catch (error) {
      toast(`Error: ${error}`, "error");
    }
  };

  return (
    <Button size="sm" variant="destructive" onClick={handleDelete}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
