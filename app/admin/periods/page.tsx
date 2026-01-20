"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner, Skeleton } from "@/components/ui/loading";
import { toast } from "@/components/ui/toast";
import { Clock, Plus, Edit2, Trash2, Coffee, Filter } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

export default function PeriodsPage() {
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const periodsWithGrades = useQuery(api.queries.periods.getAllWithGrades, { academicYear });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterGrade, setFilterGrade] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const createPeriod = useMutation(api.mutations.periods.create);

  // Group periods by grade - must be called before any conditional returns
  const periodsByGrade = useMemo(() => {
    if (!periodsWithGrades || periodsWithGrades instanceof Error) return {};
    
    // Filter periods by academic year
    const filteredPeriods = periodsWithGrades.filter(
      (p: any) => p.academicYear === academicYear
    );
    
    const grouped: Record<string, any[]> = {};
    
    filteredPeriods.forEach((period: any) => {
      // If period has grades, add to each grade group
      if (period.grades && period.grades.length > 0) {
        period.grades.forEach((grade: string) => {
          if (!grouped[grade]) {
            grouped[grade] = [];
          }
          // Only add if not already in this grade group (avoid duplicates)
          if (!grouped[grade].find((p: any) => p._id === period._id)) {
            grouped[grade].push(period);
          }
        });
      } else {
        // Periods with no grades (or break periods) go to "All Grades" or "Break Periods"
        const noGradeKey = period.isBreak ? "Break Periods" : "All Grades";
        if (!grouped[noGradeKey]) {
          grouped[noGradeKey] = [];
        }
        grouped[noGradeKey].push(period);
      }
    });
    
    // Sort periods within each grade by order
    Object.keys(grouped).forEach((grade) => {
      grouped[grade].sort((a, b) => a.order - b.order);
    });
    
    return grouped;
  }, [periodsWithGrades, academicYear]);

  // Get unique grades for filter - must be called before any conditional returns
  const allGrades = useMemo(() => {
    if (!periodsWithGrades) return [];
    const gradeSet = new Set<string>();
    periodsWithGrades.forEach((period: any) => {
      if (period.academicYear === academicYear) {
        if (period.grades && period.grades.length > 0) {
          period.grades.forEach((grade: string) => gradeSet.add(grade));
        } else {
          if (period.isBreak) {
            gradeSet.add("Break Periods");
          } else {
            gradeSet.add("All Grades");
          }
        }
      }
    });
    return Array.from(gradeSet).sort((a, b) => {
      if (a === "Break Periods") return 1;
      if (b === "Break Periods") return -1;
      if (a === "All Grades") return 1;
      if (b === "All Grades") return -1;
      return a.localeCompare(b);
    });
  }, [periodsWithGrades, academicYear]);

  // Filter periods by grade and type - must be called before any conditional returns
  const filteredPeriodsByGrade = useMemo(() => {
    let filtered = { ...periodsByGrade };
    
    // Filter by grade
    if (filterGrade) {
      const filteredGroups: Record<string, any[]> = {};
      if (filtered[filterGrade]) {
        filteredGroups[filterGrade] = filtered[filterGrade];
      }
      filtered = filteredGroups;
    }
    
    // Filter by type (break/class) within each grade
    if (filterType) {
      Object.keys(filtered).forEach((grade) => {
        filtered[grade] = filtered[grade].filter((period: any) => {
          if (filterType === "break") return period.isBreak;
          if (filterType === "class") return !period.isBreak;
          return true;
        });
      });
    }
    
    return filtered;
  }, [periodsByGrade, filterGrade, filterType]);

  if (!periodsWithGrades) {
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
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const grades = Object.keys(filteredPeriodsByGrade).sort((a, b) => {
    // Put "Break Periods" and "All Grades" at the end
    if (a === "Break Periods") return 1;
    if (b === "Break Periods") return -1;
    if (a === "All Grades") return 1;
    if (b === "All Grades") return -1;
    return a.localeCompare(b);
  });
  const filteredPeriods = periodsWithGrades.filter((p: any) => p.academicYear === academicYear);
  const totalPeriods = filteredPeriods.length;

  const handleSeedDefault = async () => {
    if (
      !confirm(
        `This will create 8 default periods (7 periods + 1 break) for ${academicYear}. Continue?`
      )
    ) {
      return;
    }

    const defaultPeriods = [
      {
        name: "First",
        nameAr: "الاولى",
        startTime: "08:10",
        endTime: "08:50",
        isBreak: false,
        order: 1,
      },
      {
        name: "Second",
        nameAr: "الثانية",
        startTime: "08:50",
        endTime: "09:30",
        isBreak: false,
        order: 2,
      },
      {
        name: "Third",
        nameAr: "الثالثة",
        startTime: "09:30",
        endTime: "10:10",
        isBreak: false,
        order: 3,
      },
      {
        name: "Break",
        nameAr: "فرصة",
        startTime: "10:10",
        endTime: "10:35",
        isBreak: true,
        order: 4,
      },
      {
        name: "Fourth",
        nameAr: "الرابعة",
        startTime: "10:35",
        endTime: "11:15",
        isBreak: false,
        order: 5,
      },
      {
        name: "Fifth",
        nameAr: "الخامسة",
        startTime: "11:15",
        endTime: "11:55",
        isBreak: false,
        order: 6,
      },
      {
        name: "Sixth",
        nameAr: "السادسة",
        startTime: "11:55",
        endTime: "12:35",
        isBreak: false,
        order: 7,
      },
      {
        name: "Seventh",
        nameAr: "السابعة",
        startTime: "12:35",
        endTime: "13:15",
        isBreak: false,
        order: 8,
      },
    ];

    try {
      for (const period of defaultPeriods) {
        await createPeriod({
          ...period,
          academicYear,
        });
      }
      toast(`Successfully created ${defaultPeriods.length} default periods!`, "success");
    } catch (error) {
      toast(`Error creating periods: ${error}`, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Periods</h1>
          <p className="mt-1 text-sm text-gray-600">Manage class periods and break times</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={academicYear}
            onChange={(e) => {
              setAcademicYear(e.target.value);
              setFilterGrade(""); // Reset grade filter when academic year changes
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2025-2026">2025-2026</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
          </select>
          <Button variant="outline" onClick={handleSeedDefault}>
            <Clock className="mr-2 h-4 w-4" />
            Seed Default
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Period
          </Button>
        </div>
      </div>

      {/* Filters */}
      {allGrades.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50">
          <div className="flex flex-wrap gap-4 items-end">
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
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                <Filter className="inline h-3.5 w-3.5 mr-1" />
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-400"
              >
                <option value="">All Types</option>
                <option value="class">Class Periods</option>
                <option value="break">Break Periods</option>
              </select>
            </div>
            {(filterGrade || filterType) && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilterGrade("");
                  setFilterType("");
                }}
                className="h-10"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Card>
      )}

      {showForm && (
        <PeriodForm
          academicYear={academicYear}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
          }}
        />
      )}

      {totalPeriods === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Clock className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No periods found</h3>
            <p className="mt-2 text-sm text-gray-600">
              Get started by creating your first period or seeding default periods.
            </p>
            <Button className="mt-6" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Period
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
                            Period
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            English Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPeriodsByGrade[grade].map((period: any) => (
                        <tr key={period._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {period.nameAr || period.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {period.startTime} - {period.endTime}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {period.nameAr && period.nameAr !== period.name ? period.name : "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {period.order}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {period.isBreak ? (
                              <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                                Break
                              </span>
                            ) : (
                              <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                Class
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(period._id)}
                                className="h-8 px-3"
                              >
                                <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <DeletePeriodButton periodId={period._id} />
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
                <p className="text-sm text-gray-500">No periods found matching the selected filters.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {editingId && (
        <PeriodForm
          periodId={editingId}
          academicYear={academicYear}
          onClose={() => setEditingId(null)}
          onSuccess={() => {
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

function PeriodForm({
  periodId,
  academicYear,
  onClose,
  onSuccess,
}: {
  periodId?: string;
  academicYear: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:40");
  const [isBreak, setIsBreak] = useState(false);
  const [order, setOrder] = useState(1);
  const createPeriod = useMutation(api.mutations.periods.create);
  const updatePeriod = useMutation(api.mutations.periods.update);
  const period = useQuery(
    api.queries.periods.getById,
    periodId ? { id: periodId as any } : "skip"
  );

  // Update form when period data loads
  if (period && periodId && name === "") {
    setName(period.name);
    setNameAr(period.nameAr || "");
    setStartTime(period.startTime);
    setEndTime(period.endTime);
    setIsBreak(period.isBreak);
    setOrder(period.order);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (periodId) {
        await updatePeriod({
          id: periodId as any,
          name,
          nameAr: nameAr || undefined,
          startTime,
          endTime,
          isBreak,
          order,
          academicYear,
        });
      } else {
        await createPeriod({
          name,
          nameAr: nameAr || undefined,
          startTime,
          endTime,
          isBreak,
          order,
          academicYear,
        });
      }
      toast(periodId ? "Period updated successfully" : "Period created successfully", "success");
      onSuccess();
    } catch (error) {
      toast(`Error: ${error}`, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">{periodId ? "Edit Period" : "Add Period"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name (English) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="First, Second, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name (Arabic) - Optional
              </label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="الاولى, الثانية, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Order <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
            <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 p-3">
              <input
                type="checkbox"
                id="isBreak"
                checked={isBreak}
                onChange={(e) => setIsBreak(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="isBreak" className="ml-2 text-sm font-medium text-gray-700">
                This is a break period
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">
                {periodId ? "Update Period" : "Create Period"}
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

function DeletePeriodButton({ periodId }: { periodId: string }) {
  const deletePeriod = useMutation(api.mutations.periods.deletePeriod);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this period?")) return;
    try {
      await deletePeriod({ id: periodId as any });
      toast("Period deleted successfully", "success");
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
