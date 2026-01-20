"use client";

import { useMemo } from "react";
import { getDayName, translatePeriodName, t } from "@/lib/i18n";

interface Lecture {
  _id: string;
  teacherId: string;
  classId?: string; // Optional for backward compatibility
  sectionId?: string; // New field
  lessonId: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  recurring: boolean;
  date?: string;
  academicYear: string;
  periodId?: string; // Direct relation to period
  subjectName?: string;
  className?: string; // Kept for backward compatibility
  sectionName?: string; // New field - preferred
  sectionGrade?: string; // New field
  sectionNumberOfStudents?: number; // Number of students in section
}

interface Period {
  _id: string;
  name: string;
  nameAr?: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  order: number;
  academicYear: string;
}

interface TimetableGridProps {
  lectures: Lecture[];
  periods: Period[];
  lang?: "ar" | "en";
  onLectureClick?: (lecture: Lecture) => void;
}

export function TimetableGrid({
  lectures,
  periods,
  lang = "en",
  onLectureClick,
}: TimetableGridProps) {
  // Sort periods by order
  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => a.order - b.order);
  }, [periods]);

  // Group lectures by day and period
  const scheduleGrid = useMemo(() => {
    const grid: Record<number, Record<string, Lecture[]>> = {};
    
    // Initialize grid for all days (0-6)
    for (let day = 0; day < 7; day++) {
      grid[day] = {};
      sortedPeriods.forEach((period) => {
        grid[day][period._id] = [];
      });
    }

    // Match lectures to periods
    lectures.forEach((lecture) => {
      if (!lecture.recurring) return; // Only show recurring lectures in grid
      
      const day = lecture.dayOfWeek;
      if (day < 0 || day > 6) return;

      // Prioritize periodId matching if available
      if (lecture.periodId) {
        const period = sortedPeriods.find((p) => p._id === lecture.periodId);
        if (period && grid[day][period._id]) {
          grid[day][period._id].push(lecture);
        }
      } else {
        // Fallback to time-based matching for backward compatibility
        const lectureStart = lecture.startTime.split(":").map(Number);
        const lectureEnd = lecture.endTime.split(":").map(Number);
        const lectureStartMinutes = lectureStart[0] * 60 + lectureStart[1];
        const lectureEndMinutes = lectureEnd[0] * 60 + lectureEnd[1];

        sortedPeriods.forEach((period) => {
          const periodStart = period.startTime.split(":").map(Number);
          const periodEnd = period.endTime.split(":").map(Number);
          const periodStartMinutes = periodStart[0] * 60 + periodStart[1];
          const periodEndMinutes = periodEnd[0] * 60 + periodEnd[1];

          // Check if lecture overlaps with period
          if (
            lectureStartMinutes < periodEndMinutes &&
            lectureEndMinutes > periodStartMinutes
          ) {
            if (!grid[day][period._id]) {
              grid[day][period._id] = [];
            }
            grid[day][period._id].push(lecture);
          }
        });
      }
    });

    return grid;
  }, [lectures, sortedPeriods]);

  const DAYS = lang === "ar" 
    ? ["احد", "اثنين", "ثلاثاء", "اربعاء", "خميس", "جمعة", "سبت"]
    : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Only show weekdays (Sunday-Thursday) by default, matching the image
  const weekdays = [0, 1, 2, 3, 4]; // Sunday to Thursday

  return (
    <div className="overflow-x-auto" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="min-w-full border border-gray-300">
        {/* Header row with periods */}
        <div className="grid border-b border-gray-300 bg-gray-50" style={{
          gridTemplateColumns: `120px repeat(${sortedPeriods.length}, minmax(120px, 1fr))`,
        }}>
          <div className="border-r border-gray-300 p-2 font-semibold">
            {lang === "ar" ? "اليوم" : "Day"}
          </div>
          {sortedPeriods.map((period) => (
            <div
              key={period._id}
              className={`border-r border-gray-300 p-2 text-center text-sm ${
                period.isBreak ? "bg-yellow-50 font-semibold" : ""
              }`}
            >
              <div className="font-medium">
                {translatePeriodName(period, lang)}
              </div>
              <div className="text-xs text-gray-600">
                {period.startTime} - {period.endTime}
              </div>
            </div>
          ))}
        </div>

        {/* Day rows */}
        {weekdays.map((dayIndex) => (
          <div
            key={dayIndex}
            className="grid border-b border-gray-300 last:border-b-0"
            style={{
              gridTemplateColumns: `120px repeat(${sortedPeriods.length}, minmax(120px, 1fr))`,
            }}
          >
            {/* Day name column */}
            <div className="border-r border-gray-300 bg-gray-50 p-3 font-medium">
              {DAYS[dayIndex]}
            </div>

            {/* Period cells */}
            {sortedPeriods.map((period) => {
              const cellLectures = scheduleGrid[dayIndex]?.[period._id] || [];
              
              return (
                <div
                  key={period._id}
                  className={`border-r border-gray-300 p-2 last:border-r-0 ${
                    period.isBreak ? "bg-yellow-50" : "bg-white"
                  }`}
                  style={{ minHeight: "80px" }}
                >
                  {cellLectures.length > 0 ? (
                    <div className="space-y-1">
                      {cellLectures.map((lecture) => (
                        <div
                          key={lecture._id}
                          className="cursor-pointer rounded bg-blue-500 p-1.5 text-xs text-white transition-colors hover:bg-blue-600"
                          onClick={() => onLectureClick?.(lecture)}
                          title={`${lecture.subjectName || "Unknown"} - ${lecture.sectionName || lecture.className || "Unknown"}`}
                        >
                          <div className="font-medium">
                            {lecture.subjectName || "Unknown"}
                          </div>
                          <div className="text-xs opacity-90">
                            {(() => {
                              if (lecture.sectionName) {
                                // Show full section info: "Section Name - Grade (X students)"
                                const parts = [lecture.sectionName];
                                if (lecture.sectionGrade) {
                                  parts.push(lecture.sectionGrade);
                                }
                                if (lecture.sectionNumberOfStudents !== undefined) {
                                  parts.push(`(${lecture.sectionNumberOfStudents} students)`);
                                }
                                return parts.join(" - ");
                              }
                              return lecture.className || "Unknown";
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-xs text-gray-400">
                      {period.isBreak ? t("break", lang) : "—"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
