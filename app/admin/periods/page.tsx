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
  const periods = useQuery(api.queries.periods.getByAcademicYear, { academicYear });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>("");
  const createPeriod = useMutation(api.mutations.periods.create);

  // Sort and filter periods - must be before any conditional returns
  const sortedPeriods = useMemo(() => {
    if (!periods) return [];
    let filtered = [...periods].sort((a, b) => a.order - b.order);
    
    // Filter by type (break/class)
    if (filterType === "break") {
      filtered = filtered.filter((p) => p.isBreak);
    } else if (filterType === "class") {
      filtered = filtered.filter((p) => !p.isBreak);
    }
    
    return filtered;
  }, [periods, filterType]);

  if (!periods) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

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
        startTime: "08:15",
        endTime: "09:00",
        isBreak: false,
        order: 1,
      },
      {
        name: "Second",
        nameAr: "الثانية",
        startTime: "09:00",
        endTime: "09:45",
        isBreak: false,
        order: 2,
      },
      {
        name: "Third",
        nameAr: "الثالثة",
        startTime: "09:45",
        endTime: "10:30",
        isBreak: false,
        order: 3,
      },
      {
        name: "Break",
        nameAr: "فرصة",
        startTime: "10:30",
        endTime: "11:00",
        isBreak: true,
        order: 4,
      },
      {
        name: "Fourth",
        nameAr: "الرابعة",
        startTime: "11:00",
        endTime: "11:45",
        isBreak: false,
        order: 5,
      },
      {
        name: "Fifth",
        nameAr: "الخامسة",
        startTime: "11:45",
        endTime: "12:30",
        isBreak: false,
        order: 6,
      },
      {
        name: "Sixth",
        nameAr: "السادسة",
        startTime: "12:30",
        endTime: "13:15",
        isBreak: false,
        order: 7,
      },
      {
        name: "Seventh",
        nameAr: "السابعة",
        startTime: "13:15",
        endTime: "14:00",
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
      toast.success(`Successfully created ${defaultPeriods.length} default periods!`);
    } catch (error) {
      toast.error(`Error creating periods: ${error}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Periods</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage school-wide class periods and break times
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
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

      {showForm && (
        <PeriodForm
          academicYear={academicYear}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
          }}
        />
      )}

      <Card>
        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              All Periods ({sortedPeriods.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">
                <Filter className="inline h-3.5 w-3.5 mr-1" />
                Filter:
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="">All Types</option>
                <option value="class">Class Periods</option>
                <option value="break">Break Periods</option>
              </select>
              {filterType && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterType("")}
                  className="h-7 px-2 text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sortedPeriods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No periods found</h3>
              <p className="mt-2 text-sm text-gray-600">
                {filterType
                  ? "No periods match the selected filter."
                  : "Get started by creating your first period or seeding default periods."}
              </p>
              {!filterType && (
                <Button className="mt-6" onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Period
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Arabic Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
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
                  {sortedPeriods.map((period: any) => {
                    // Calculate duration
                    const [startH, startM] = period.startTime.split(":").map(Number);
                    const [endH, endM] = period.endTime.split(":").map(Number);
                    const durationMins = (endH * 60 + endM) - (startH * 60 + startM);
                    
                    return (
                      <tr key={period._id} className={`hover:bg-gray-50 ${period.isBreak ? "bg-orange-50/30" : ""}`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                            {period.order}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {period.isBreak && <Coffee className="h-4 w-4 text-orange-500" />}
                            <span className="text-sm font-medium text-gray-900">
                              {period.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-600" dir="rtl">
                            {period.nameAr || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-700">
                            {period.startTime}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-700">
                            {period.endTime}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {durationMins} min
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {period.isBreak ? (
                            <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                              <Coffee className="mr-1 h-3 w-3" />
                              Break
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              <Clock className="mr-1 h-3 w-3" />
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
  const [endTime, setEndTime] = useState("08:45");
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
      toast.success(periodId ? "Period updated successfully" : "Period created successfully");
      onSuccess();
    } catch (error) {
      toast.error(`Error: ${error}`);
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
            <div className="grid grid-cols-2 gap-4">
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
                  placeholder="First, Second..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name (Arabic)
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="الاولى, الثانية..."
                  dir="rtl"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
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
            </div>
            <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 p-3">
              <input
                type="checkbox"
                id="isBreak"
                checked={isBreak}
                onChange={(e) => setIsBreak(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-500"
              />
              <label htmlFor="isBreak" className="ml-2 text-sm font-medium text-gray-700">
                <Coffee className="inline h-4 w-4 mr-1 text-orange-500" />
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
    if (!confirm("Are you sure you want to delete this period? This will affect all schedules using this period.")) return;
    try {
      await deletePeriod({ id: periodId as any });
      toast.success("Period deleted successfully");
    } catch (error) {
      toast.error(`Error: ${error}`);
    }
  };

  return (
    <Button size="sm" variant="destructive" onClick={handleDelete}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
