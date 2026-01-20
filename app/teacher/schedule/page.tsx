"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { TeacherScheduleView } from "@/components/TeacherScheduleView";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { t } from "@/lib/i18n";

export default function TeacherSchedulePage() {
  const { user } = useAuth();
  const [academicYear] = useState("2024-2025");
  const [lang, setLang] = useState<"ar" | "en">("ar");

  const teacher = useQuery(
    api.queries.teachers.getByUserId,
    user?.id ? { userId: user.id as any } : "skip"
  );

  const lectures = useQuery(
    api.queries.lectures.getByTeacherWithDetails,
    teacher?._id ? { teacherId: teacher._id as any, academicYear } : "skip"
  );

  const periods = useQuery(
    api.queries.periods.getByAcademicYear,
    { academicYear }
  );

  if (!teacher || !lectures || !periods) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Format creation date
  const creationDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {lang === "ar" ? `المعلمة ${teacher.name}` : `Teacher ${teacher.name}`}
              </h1>
              <p className="mt-1 text-lg text-gray-600">
                {process.env.NEXT_PUBLIC_SCHOOL_NAME || "Alahed International Schools, Huson"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as "ar" | "en")}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
              <select
                value={academicYear}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                disabled
              >
                <option value={academicYear}>{academicYear}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Timetable Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-6">
            <TeacherScheduleView
              periods={periods}
              lectures={lectures}
              teacherName={teacher.name}
              lang={lang}
            />
          </CardContent>
        </Card>
      </div>

      {/* Footer Section */}
      <div className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              {lang === "ar" 
                ? `تم إنشاء الجدول : ${creationDate}`
                : `${t("created", lang)}: ${creationDate}`
              }
            </div>
            <div className="text-gray-500">
              {process.env.NEXT_PUBLIC_SCHOOL_NAME || "School Management System"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
