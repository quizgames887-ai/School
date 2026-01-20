"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Filter, Search } from "lucide-react";

export default function CurriculumPage() {
  const curriculum = useQuery(api.queries.curriculum.getFullCurriculum);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>("");

  const deleteSubject = useMutation(api.mutations.subjects.deleteSubject);
  const deleteUnit = useMutation(api.mutations.units.deleteUnit);
  const deleteLesson = useMutation(api.mutations.lessons.deleteLesson);

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm("Are you sure you want to delete this subject? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteSubject({ id: subjectId as any });
    } catch (error: any) {
      alert(`Error: ${error.message || error}`);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm("Are you sure you want to delete this unit? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteUnit({ id: unitId as any });
    } catch (error: any) {
      alert(`Error: ${error.message || error}`);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteLesson({ id: lessonId as any });
    } catch (error: any) {
      alert(`Error: ${error.message || error}`);
    }
  };

  // Filter curriculum by subject name - must be called before any conditional returns
  const filteredCurriculum = useMemo(() => {
    if (!curriculum || !filterSubject) return curriculum || [];
    const searchTerm = filterSubject.toLowerCase();
    return curriculum.filter((subject: any) =>
      subject.name.toLowerCase().includes(searchTerm)
    );
  }, [curriculum, filterSubject]);

  if (!curriculum) {
    return <div>Loading...</div>;
  }

  const selectedSubjectData = filteredCurriculum.find((s: any) => s._id === selectedSubject);
  const selectedUnitData = selectedSubjectData?.units.find(
    (u: any) => u._id === selectedUnit
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Curriculum</h1>
        <Button onClick={() => setShowSubjectForm(true)}>Add Subject</Button>
      </div>

      {/* Filter */}
      {curriculum.length > 0 && (
        <Card className="p-4 mb-6 bg-gradient-to-r from-gray-50 to-gray-100/50">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                <Search className="inline h-3.5 w-3.5 mr-1" />
                Search Subject
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  placeholder="Search by subject name..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-400"
                />
              </div>
            </div>
            {filterSubject && (
              <Button
                variant="outline"
                onClick={() => setFilterSubject("")}
                className="h-10 mt-6"
              >
                Clear Filter
              </Button>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Subjects List */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Subjects</h2>
          <div className="space-y-2">
            {filteredCurriculum.length > 0 ? (
              filteredCurriculum.map((subject: any) => (
              <Card
                key={subject._id}
                className={`${
                  selectedSubject === subject._id ? "border-blue-500" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedSubject(subject._id);
                        setSelectedUnit(null);
                      }}
                    >
                      <h3 className="font-medium">{subject.name}</h3>
                      <p className="text-sm text-gray-600">
                        {subject.units.length} units
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSubject(subject._id);
                          setShowSubjectForm(true);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(subject._id);
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-gray-500">No subjects found matching your search.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Units List */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Units</h2>
            {selectedSubject && (
              <Button
                size="sm"
                onClick={() => {
                  setShowUnitForm(true);
                }}
              >
                Add Unit
              </Button>
            )}
          </div>
          {selectedSubjectData ? (
            <div className="space-y-2">
              {selectedSubjectData.units.map((unit: any) => (
                <Card
                  key={unit._id}
                  className={`${
                    selectedUnit === unit._id ? "border-blue-500" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedUnit(unit._id)}
                      >
                        <h3 className="font-medium">{unit.name}</h3>
                        <p className="text-sm text-gray-600">
                          {unit.lessons.length} lessons
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingUnit(unit._id);
                            setShowUnitForm(true);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUnit(unit._id);
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Select a subject to view units</p>
          )}
        </div>

        {/* Lessons List */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Lessons</h2>
            {selectedUnit && (
              <Button
                size="sm"
                onClick={() => {
                  setShowLessonForm(true);
                }}
              >
                Add Lesson
              </Button>
            )}
          </div>
          {selectedUnitData ? (
            <div className="space-y-2">
              {selectedUnitData.lessons.map((lesson: any) => (
                <Card key={lesson._id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{lesson.name}</h3>
                        <p className="text-sm text-gray-600">
                          Duration: {lesson.duration} min
                        </p>
                        {lesson.prerequisites.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {lesson.prerequisites.length} prerequisite(s)
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingLesson(lesson._id);
                            setShowLessonForm(true);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLesson(lesson._id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Select a unit to view lessons</p>
          )}
        </div>
      </div>

      {showSubjectForm && (
        <SubjectForm
          subjectId={editingSubject}
          onClose={() => {
            setShowSubjectForm(false);
            setEditingSubject(null);
          }}
          onSuccess={() => {
            setShowSubjectForm(false);
            setEditingSubject(null);
          }}
        />
      )}

      {showUnitForm && selectedSubject && (
        <UnitForm
          unitId={editingUnit}
          subjectId={selectedSubject}
          onClose={() => {
            setShowUnitForm(false);
            setEditingUnit(null);
          }}
          onSuccess={() => {
            setShowUnitForm(false);
            setEditingUnit(null);
          }}
        />
      )}

      {showLessonForm && selectedUnit && (
        <LessonForm
          lessonId={editingLesson}
          unitId={selectedUnit}
          onClose={() => {
            setShowLessonForm(false);
            setEditingLesson(null);
          }}
          onSuccess={() => {
            setShowLessonForm(false);
            setEditingLesson(null);
          }}
        />
      )}
    </div>
  );
}

function SubjectForm({
  subjectId,
  onClose,
  onSuccess,
}: {
  subjectId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createSubject = useMutation(api.mutations.subjects.create);
  const updateSubject = useMutation(api.mutations.subjects.update);
  const curriculum = useQuery(api.queries.curriculum.getFullCurriculum);
  
  const existingSubject = curriculum?.find((s: any) => s._id === subjectId);

  // Load existing data when editing
  useEffect(() => {
    if (existingSubject) {
      setName(existingSubject.name);
      setDescription(existingSubject.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [existingSubject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (subjectId) {
        await updateSubject({
          id: subjectId as any,
          name,
          description: description || undefined,
        });
      } else {
        await createSubject({
          name,
          description: description || undefined,
        });
      }
      onSuccess();
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{subjectId ? "Edit Subject" : "Add Subject"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Create</Button>
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

function UnitForm({
  unitId,
  subjectId,
  onClose,
  onSuccess,
}: {
  unitId?: string | null;
  subjectId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(1);
  const createUnit = useMutation(api.mutations.units.create);
  const updateUnit = useMutation(api.mutations.units.update);
  const curriculum = useQuery(api.queries.curriculum.getFullCurriculum);
  const subjectData = curriculum?.find((s: any) => s._id === subjectId);
  const existingUnit = subjectData?.units.find((u: any) => u._id === unitId);

  // Load existing data when editing
  useEffect(() => {
    if (existingUnit) {
      setName(existingUnit.name);
      setDescription(existingUnit.description || "");
      setOrder(existingUnit.order);
    } else {
      setName("");
      setDescription("");
      setOrder(1);
    }
  }, [existingUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (unitId) {
        await updateUnit({
          id: unitId as any,
          name,
          order,
          description: description || undefined,
        });
      } else {
        await createUnit({
          subjectId: subjectId as any,
          name,
          order,
          description: description || undefined,
        });
      }
      onSuccess();
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{unitId ? "Edit Unit" : "Add Unit"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Order</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                min={1}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">{unitId ? "Update" : "Create"}</Button>
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

function LessonForm({
  lessonId,
  unitId,
  onClose,
  onSuccess,
}: {
  lessonId?: string | null;
  unitId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);
  const [order, setOrder] = useState(1);
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const createLesson = useMutation(api.mutations.lessons.create);
  const updateLesson = useMutation(api.mutations.lessons.update);
  const curriculum = useQuery(api.queries.curriculum.getFullCurriculum);
  
  // Get all lessons for prerequisite selection
  const allLessons = curriculum?.flatMap((subject: any) =>
    subject.units.flatMap((unit: any) => unit.lessons)
  ) || [];

  const selectedUnitData = curriculum
    ?.flatMap((subject: any) => subject.units)
    .find((unit: any) => unit._id === unitId);
  const existingLesson = selectedUnitData?.lessons.find((l: any) => l._id === lessonId);

  // Load existing data when editing
  useEffect(() => {
    if (existingLesson) {
      setName(existingLesson.name);
      setDuration(existingLesson.duration);
      setOrder(existingLesson.order);
      setPrerequisites(existingLesson.prerequisites || []);
    } else {
      setName("");
      setDuration(60);
      setOrder(1);
      setPrerequisites([]);
    }
  }, [existingLesson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (lessonId) {
        await updateLesson({
          id: lessonId as any,
          name,
          duration,
          order,
          prerequisites: prerequisites as any[],
        });
      } else {
        await createLesson({
          unitId: unitId as any,
          name,
          duration,
          order,
          prerequisites: prerequisites as any[],
        });
      }
      onSuccess();
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{lessonId ? "Edit Lesson" : "Add Lesson"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Duration (minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                min={1}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Order</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                min={1}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Prerequisites</label>
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                {allLessons
                  .filter((lesson: any) => lesson._id !== lessonId) // Exclude current lesson when editing
                  .map((lesson: any) => (
                    <label key={lesson._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={prerequisites.includes(lesson._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPrerequisites([...prerequisites, lesson._id]);
                          } else {
                            setPrerequisites(
                              prerequisites.filter((id: any) => id !== lesson._id)
                            );
                          }
                        }}
                        className="mr-2"
                      />
                      {lesson.name}
                    </label>
                  ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Create</Button>
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
