"use client";

import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { TeacherScheduleView } from "@/components/TeacherScheduleView";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { useTranslation } from "@/lib/translation-context";
import { AlertCircle, Globe } from "lucide-react";
import { toast } from "@/components/ui/toast";

export default function TeacherSchedulePage() {
  const { user } = useAuth();
  const [academicYear] = useState("2025-2026");
  const { t, language } = useTranslation();
  const lang = language; // Use global language setting
  const setLanguage = useMutation(api.mutations.translations.setLanguage);
  const deleteLecture = useMutation(api.mutations.lectures.deleteLecture);

  const handleLanguageChange = async (newLang: "en" | "ar") => {
    try {
      await setLanguage({ language: newLang });
    } catch (error) {
      console.error("Failed to change language:", error);
    }
  };

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
                {t("teacher.profileNotFound", "Teacher Profile Not Found")}
              </h2>
              <p className="text-gray-600">
                {t("teacher.profileNotFoundDesc", "Your account is not linked to a teacher profile. Please contact an administrator.")}
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
                {t("teacher.title", "Teacher")} {teacher.name}
              </h1>
              <p className="mt-1 text-lg text-gray-600">
                {t("teacher.weeklySchedule", "Weekly Schedule")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <select
                  value={lang}
                  onChange={(e) => handleLanguageChange(e.target.value as "en" | "ar")}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium bg-white shadow-sm hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
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
                isAdmin={true}
                onDeleteLecture={async (lectureId) => {
                  try {
                    await deleteLecture({ id: lectureId });
                    toast.success(lang === "ar" ? "تم حذف الحصة بنجاح" : "Lecture deleted successfully");
                  } catch (error) {
                    toast.error(lang === "ar" ? "فشل في حذف الحصة" : "Failed to delete lecture");
                  }
                }}
              />
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("teacher.noLectures", "No Scheduled Lectures")}
                </h3>
                <p className="text-gray-500">
                  {t("teacher.noLecturesDesc", `No lectures have been scheduled for ${academicYear}`)}
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
              {t("teacher.scheduleCreated", "Schedule created")}: {creationDate}
            </div>
            <div className="text-gray-500">
              {t("common.schoolName", "Alahed International Schools")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
