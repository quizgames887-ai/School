"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Users, Filter } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading";

export default function SectionsPage() {
  const sections = useQuery(api.queries.sections.getAll);
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [filterGrade, setFilterGrade] = useState<string>("");
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>("");

  const deleteSection = useMutation(api.mutations.sections.deleteSection);

  // Group sections by grade - must be called before any conditional returns
  const sectionsByGrade = useMemo(() => {
    if (!sections || sections instanceof Error) return {};
    
    const grouped: Record<string, any[]> = {};
    sections.forEach((section: any) => {
      const grade = section.grade || "Unknown";
      if (!grouped[grade]) {
        grouped[grade] = [];
      }
      grouped[grade].push(section);
    });
    
    // Sort sections within each grade by name
    Object.keys(grouped).forEach((grade) => {
      grouped[grade].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return grouped;
  }, [sections]);

  const handleDelete = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteSection({ id: sectionId as any });
    } catch (error: any) {
      alert(`Error: ${error.message || error}`);
    }
  };

  if (!sections) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Get unique grades and academic years for filters
  const allGrades = useMemo(() => {
    const gradeSet = new Set<string>();
    sections.forEach((section: any) => {
      if (section.grade) gradeSet.add(section.grade);
    });
    return Array.from(gradeSet).sort();
  }, [sections]);

  const allAcademicYears = useMemo(() => {
    const yearSet = new Set<string>();
    sections.forEach((section: any) => {
      if (section.academicYear) yearSet.add(section.academicYear);
    });
    return Array.from(yearSet).sort().reverse();
  }, [sections]);

  // Filter sections by grade and academic year
  const filteredSectionsByGrade = useMemo(() => {
    let filtered = { ...sectionsByGrade };
    
    // Filter by grade
    if (filterGrade) {
      const filteredGroups: Record<string, any[]> = {};
      if (filtered[filterGrade]) {
        filteredGroups[filterGrade] = filtered[filterGrade];
      }
      filtered = filteredGroups;
    }
    
    // Filter by academic year within each grade
    if (filterAcademicYear) {
      Object.keys(filtered).forEach((grade) => {
        filtered[grade] = filtered[grade].filter((section: any) =>
          section.academicYear === filterAcademicYear
        );
      });
    }
    
    return filtered;
  }, [sectionsByGrade, filterGrade, filterAcademicYear]);

  const grades = Object.keys(filteredSectionsByGrade).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sections</h1>
          <p className="mt-1 text-sm text-gray-600">Manage class sections</p>
        </div>
        <Button onClick={() => setShowForm(true)}>Add Section</Button>
      </div>

      {/* Filters */}
      {(allGrades.length > 0 || allAcademicYears.length > 0) && (
        <Card className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50">
          <div className="flex flex-wrap gap-4 items-end">
            {allGrades.length > 0 && (
              <div className="flex-1 min-w-[200px]">
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
            {allAcademicYears.length > 0 && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  <Filter className="inline h-3.5 w-3.5 mr-1" />
                  Filter by Academic Year
                </label>
                <select
                  value={filterAcademicYear}
                  onChange={(e) => setFilterAcademicYear(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-400"
                >
                  <option value="">All Academic Years</option>
                  {allAcademicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(filterGrade || filterAcademicYear) && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilterGrade("");
                  setFilterAcademicYear("");
                }}
                className="h-10"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Card>
      )}

      {sections.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No sections</h3>
            <p className="mt-2 text-sm text-gray-600">
              Get started by creating a new section.
            </p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              Add Section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grades.length > 0 ? (
            grades.map((grade) => (
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
                            Section
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Students
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Academic Year
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSectionsByGrade[grade].map((section: any) => (
                        <tr key={section._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {section.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {section.numberOfStudents}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {section.academicYear}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingSection(section._id);
                                  setShowForm(true);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(section._id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
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
                <p className="text-sm text-gray-500">No sections found matching the selected filters.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {showForm && (
        <SectionForm
          sectionId={editingSection}
          onClose={() => {
            setShowForm(false);
            setEditingSection(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingSection(null);
          }}
        />
      )}
    </div>
  );
}

function SectionForm({
  sectionId,
  onClose,
  onSuccess,
}: {
  sectionId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [numberOfStudents, setNumberOfStudents] = useState(0);
  const [academicYear, setAcademicYear] = useState("2025-2026");
  
  const createSection = useMutation(api.mutations.sections.create);
  const updateSection = useMutation(api.mutations.sections.update);
  const sections = useQuery(api.queries.sections.getAll);
  
  const existingSection = sections?.find((s: any) => s._id === sectionId);

  useEffect(() => {
    if (existingSection) {
      setName(existingSection.name);
      setGrade(existingSection.grade);
      setNumberOfStudents(existingSection.numberOfStudents);
      setAcademicYear(existingSection.academicYear);
    } else {
      setName("");
      setGrade("");
      setNumberOfStudents(0);
      setAcademicYear("2025-2026");
    }
  }, [existingSection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (sectionId) {
        await updateSection({
          id: sectionId as any,
          name,
          grade,
          numberOfStudents,
          academicYear,
        });
      } else {
        await createSection({
          name,
          grade,
          numberOfStudents,
          academicYear,
        });
      }
      onSuccess();
    } catch (error: any) {
      alert(`Error: ${error.message || error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{sectionId ? "Edit Section" : "Add Section"}</CardTitle>
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
                placeholder="e.g., Section A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Grade</label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="e.g., Grade 1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Number of Students</label>
              <input
                type="number"
                value={numberOfStudents}
                onChange={(e) => setNumberOfStudents(parseInt(e.target.value) || 0)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                min={0}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Academic Year</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="e.g., 2024-2025"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">{sectionId ? "Update" : "Create"}</Button>
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
