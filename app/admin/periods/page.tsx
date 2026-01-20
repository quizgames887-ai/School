"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner, Skeleton } from "@/components/ui/loading";
import { toast } from "@/components/ui/toast";
import { Clock, Plus, Edit2, Trash2, Coffee } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

export default function PeriodsPage() {
  const periods = useQuery(api.queries.periods.getAll);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const createPeriod = useMutation(api.mutations.periods.create);

  if (!periods) {
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

  const filteredPeriods = periods.filter((p: Doc<"periods">) => p.academicYear === academicYear);

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
            onChange={(e) => setAcademicYear(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPeriods
          .sort((a: any, b: any) => a.order - b.order)
          .map((period: any) => (
            <Card key={period._id}>
              <CardHeader>
                <CardTitle>
                  {period.nameAr || period.name}
                  {period.isBreak && (
                    <span className="ml-2 text-sm font-normal text-gray-500">(Break)</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {period.startTime} - {period.endTime}
                </p>
                {period.nameAr && period.nameAr !== period.name && (
                  <p className="mt-1 text-sm text-gray-500">{period.name}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">Order: {period.order}</p>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(period._id)}
                  >
                    Edit
                  </Button>
                  <DeletePeriodButton periodId={period._id} />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

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
