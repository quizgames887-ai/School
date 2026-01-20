"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner, Skeleton } from "@/components/ui/loading";
import { toast } from "@/components/ui/toast";
import { Users, Plus, Edit2, Trash2, Mail } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

export default function TeachersPage() {
  const teachers = useQuery(api.queries.teachers.getAll);
  const subjects = useQuery(api.queries.subjects.getAll);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (!teachers || !subjects) {
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

      {teachers.length === 0 ? (
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher: Doc<"teachers">) => (
            <Card
              key={teacher._id}
              className="transition-all hover:shadow-lg hover:shadow-gray-200"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <Users className="h-5 w-5" />
                      </div>
                      <span className="text-lg">{teacher.name}</span>
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{teacher.email}</span>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-700">Subjects:</p>
                    {teacher.subjects.length === 0 ? (
                      <p className="text-xs text-gray-500">No subjects assigned</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.subjects.map((subjectId: any) => {
                          const subject = subjects.find((s: Doc<"subjects">) => s._id === subjectId);
                          return (
                            <span
                              key={subjectId}
                              className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800"
                            >
                              {subject?.name || "Unknown"}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(teacher._id)}
                    className="flex-1"
                  >
                    <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <DeleteTeacherButton teacherId={teacher._id} />
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
