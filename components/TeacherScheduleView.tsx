"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users } from "lucide-react";
import type { Doc, Id } from "../convex/_generated/dataModel";

interface Period {
  _id: Id<"periods">;
  name: string;
  nameAr?: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  order: number;
}

interface Lecture {
  _id: Id<"lectures">;
  teacherId: Id<"teachers">;
  classId?: Id<"classes">; // Optional for backward compatibility
  sectionId?: Id<"sections">; // New field
  lessonId: Id<"lessons">;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  recurring: boolean;
  date?: string;
  periodId?: Id<"periods">;
  subjectName?: string;
  className?: string; // Kept for backward compatibility
  sectionName?: string; // New field - preferred
  sectionGrade?: string; // New field
  sectionNumberOfStudents?: number; // Number of students in section
  lessonName?: string;
}

interface TeacherScheduleViewProps {
  periods: Period[];
  lectures: Lecture[];
  teacherName?: string;
  lang?: "ar" | "en";
  onLectureClick?: (lecture: Lecture) => void;
}

const DAYS = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ar: ["احد", "اثنين", "ثلاثاء", "اربعاء", "خميس", "جمعة", "سبت"],
};

export function TeacherScheduleView({
  periods,
  lectures,
  teacherName,
  lang = "en",
  onLectureClick,
}: TeacherScheduleViewProps) {
  // Sort periods by order
  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => a.order - b.order).filter((p) => !p.isBreak);
  }, [periods]);

  // Organize lectures by period and day
  const scheduleGrid = useMemo(() => {
    const grid: Record<string, Record<number, Lecture[]>> = {};

    // Initialize grid
    sortedPeriods.forEach((period) => {
      grid[period._id] = {};
      for (let day = 0; day < 7; day++) {
        grid[period._id][day] = [];
      }
    });

    // Populate grid with lectures (recurring + one-time with date)
    lectures.forEach((lecture) => {
      let day: number;
      if (lecture.recurring) {
        day = lecture.dayOfWeek;
      } else if (lecture.date) {
        day = new Date(lecture.date).getDay();
      } else {
        return; // one-time without date cannot be placed in weekly grid
      }
      if (day < 0 || day > 6) return;

      // If lecture has periodId, use it directly
      if (lecture.periodId && grid[lecture.periodId]) {
        grid[lecture.periodId][day].push(lecture);
      } else {
        // Fallback to time-based matching
        const lectureStart = lecture.startTime.split(":").map(Number);
        const lectureEnd = lecture.endTime.split(":").map(Number);
        const lectureStartMinutes = lectureStart[0] * 60 + lectureStart[1];
        const lectureEndMinutes = lectureEnd[0] * 60 + lectureEnd[1];

        sortedPeriods.forEach((period) => {
          const periodStart = period.startTime.split(":").map(Number);
          const periodEnd = period.endTime.split(":").map(Number);
          const periodStartMinutes = periodStart[0] * 60 + periodStart[1];
          const periodEndMinutes = periodEnd[0] * 60 + periodEnd[1];

          if (
            lectureStartMinutes < periodEndMinutes &&
            lectureEndMinutes > periodStartMinutes
          ) {
            grid[period._id][day].push(lecture);
          }
        });
      }
    });

    return grid;
  }, [lectures, sortedPeriods]);

  // Only show weekdays (Sunday-Thursday) by default
  const weekdays = [0, 1, 2, 3, 4];
  const dayNames = DAYS[lang];

  return (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      {teacherName && (
        <div className="mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{teacherName}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Weekly Schedule Overview</p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto -mx-2 px-2 w-full">
        <div className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
          {/* Header row with days */}
          <div
            className="grid bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200"
            style={{
              gridTemplateColumns: `110px repeat(${weekdays.length}, minmax(110px, 1fr))`,
            }}
          >
            <div className="border-r border-gray-200 p-2 font-bold text-gray-800 text-[10px] uppercase tracking-wide">
              <div className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5 text-gray-600" />
                {lang === "ar" ? "الحصة" : "Period"}
              </div>
            </div>
            {weekdays.map((dayIndex) => (
              <div
                key={dayIndex}
                className="border-r border-gray-200 last:border-r-0 p-2 text-center font-bold text-gray-800 text-[10px] uppercase tracking-wide"
              >
                {dayNames[dayIndex]}
              </div>
            ))}
          </div>

          {/* Period rows */}
          {sortedPeriods.map((period, periodIndex) => (
            <div
              key={period._id}
              className={`grid border-b border-gray-200 last:border-b-0 transition-all duration-200 ${
                periodIndex % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/50 hover:bg-gray-100"
              }`}
              style={{
                gridTemplateColumns: `110px repeat(${weekdays.length}, minmax(110px, 1fr))`,
              }}
            >
              {/* Period name column */}
              <div className="border-r border-gray-200 bg-gradient-to-r from-gray-50 to-white p-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex-shrink-0 h-5 w-5 rounded bg-blue-100 flex items-center justify-center">
                    <Clock className="h-2.5 w-2.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-[10px] leading-tight">
                      {lang === "ar" && period.nameAr ? period.nameAr : period.name}
                    </div>
                    <div className="text-[9px] text-gray-600 font-medium mt-0.5 leading-tight">
                      {period.startTime} - {period.endTime}
                    </div>
                  </div>
                </div>
              </div>

              {/* Day cells */}
              {weekdays.map((dayIndex) => {
                const cellLectures = scheduleGrid[period._id]?.[dayIndex] || [];

                return (
                  <div
                    key={dayIndex}
                    className="border-r border-gray-200 last:border-r-0 p-1.5 bg-white/50"
                    style={{ minHeight: "75px" }}
                  >
                    {cellLectures.length > 0 ? (
                      <div className="space-y-1">
                        {cellLectures.map((lecture) => (
                          <div
                            key={lecture._id}
                            className={`rounded p-1.5 text-[10px] transition-all duration-200 shadow-sm ${
                              onLectureClick
                                ? "cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-md transform hover:scale-[1.02]"
                                : "bg-blue-50 text-blue-900 border border-blue-200"
                            }`}
                            onClick={() => onLectureClick?.(lecture)}
                            title={`${lecture.subjectName || "Unknown"} - ${lecture.sectionName || lecture.className || "Unknown"}`}
                          >
                            <div className="font-bold text-[10px] mb-0.5 leading-tight break-words">
                              {lecture.subjectName || "Unknown"}
                            </div>
                            <div className="text-[9px] opacity-90 mt-0.5 leading-tight break-words line-clamp-2">
                              {(() => {
                                let displayName = "Unknown";
                                if (lecture.sectionName) {
                                  // Show full section info: "Section Name - Grade (X students)"
                                  const parts = [lecture.sectionName];
                                  if (lecture.sectionGrade) {
                                    parts.push(lecture.sectionGrade);
                                  }
                                  if (lecture.sectionNumberOfStudents !== undefined) {
                                    parts.push(`(${lecture.sectionNumberOfStudents} students)`);
                                  }
                                  displayName = parts.join(" - ");
                                } else if (lecture.className) {
                                  displayName = lecture.className;
                                }
                                return displayName;
                              })()}
                            </div>
                            {lecture.lessonName && (
                              <div className="text-[9px] opacity-75 mt-0.5 pt-0.5 border-t border-white/20 break-words line-clamp-1">
                                {lecture.lessonName}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full min-h-[60px]">
                        <div className="text-center">
                          <div className="text-gray-300 text-lg mb-0.5">—</div>
                          <div className="text-[9px] text-gray-400">Free</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
