"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { TeacherScheduleView } from "@/components/TeacherScheduleView";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { t } from "@/lib/i18n";
import { AlertCircle } from "lucide-react";

export default function TeacherSchedulePage() {
  const { user } = useAuth();
  const [academicYear] = useState("2025-2026");
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

  // Loading state
  if (teacher === undefined || (teacher && (lectures === undefined || periods === undefined))) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Teacher profile not found
  if (teacher === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {lang === "ar" ? "لم يتم العثور على ملف المعلم" : "Teacher Profile Not Found"}
              </h2>
              <p className="text-gray-600">
                {lang === "ar" 
                  ? "حسابك غير مرتبط بملف معلم. يرجى الاتصال بالمسؤول."
                  : "Your account is not linked to a teacher profile. Please contact an administrator."}
              </p>
            </CardContent>
          </Card>
        </div>
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
                {lang === "ar" ? "جدول الحصص الأسبوعي" : "Weekly Schedule"}
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
              <div className="px-3 py-2 bg-blue-50 rounded-md text-sm font-medium text-blue-700">
                {academicYear}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timetable Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-6">
            {lectures && lectures.length > 0 ? (
              <TeacherScheduleView
                periods={periods || []}
                lectures={lectures}
                teacherName={teacher.name}
                lang={lang}
              />
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {lang === "ar" ? "لا توجد حصص مجدولة" : "No Scheduled Lectures"}
                </h3>
                <p className="text-gray-500">
                  {lang === "ar" 
                    ? `لم يتم جدولة أي حصص للعام الدراسي ${academicYear}`
                    : `No lectures have been scheduled for ${academicYear}`}
                </p>
              </div>
            )}
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
              Alahed International Schools
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
