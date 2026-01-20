"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";

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
  subjectName?: string;
  sectionName?: string; // New field - preferred
  className?: string; // Kept for backward compatibility
}

interface CalendarProps {
  lectures: Lecture[];
  onLectureClick?: (lecture: Lecture) => void;
  view?: "week" | "month";
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

export function Calendar({ lectures, onLectureClick, view = "week" }: CalendarProps) {
  const lecturesByDay = useMemo(() => {
    const grouped: Record<number, Lecture[]> = {};
    lectures.forEach((lecture) => {
      if (lecture.recurring) {
        if (!grouped[lecture.dayOfWeek]) {
          grouped[lecture.dayOfWeek] = [];
        }
        grouped[lecture.dayOfWeek].push(lecture);
      }
    });
    return grouped;
  }, [lectures]);

  const getTimePosition = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 8 * 60; // 8 AM
    return ((totalMinutes - startMinutes) / 60) * 100; // Percentage from top
  };

  const getDuration = (startTime: string, endTime: string) => {
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    const start = startHours * 60 + startMinutes;
    const end = endHours * 60 + endMinutes;
    return ((end - start) / 60) * 100; // Percentage height
  };

  if (view === "week") {
    return (
      <div className="overflow-x-auto">
        <div className="grid min-w-[800px] grid-cols-8 border border-gray-200">
          {/* Time column */}
          <div className="border-r border-gray-200">
            <div className="h-12 border-b border-gray-200"></div>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b border-gray-200 px-2 text-sm text-gray-500"
              >
                {hour}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((day, dayIndex) => {
            const dayLectures = lecturesByDay[dayIndex] || [];
            return (
              <div key={day} className="border-r border-gray-200 last:border-r-0">
                <div className="h-12 border-b border-gray-200 bg-gray-50 p-2 text-center font-medium">
                  {day.slice(0, 3)}
                </div>
                <div className="relative">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="h-16 border-b border-gray-100"
                    ></div>
                  ))}
                  {dayLectures.map((lecture) => {
                    const top = getTimePosition(lecture.startTime);
                    const height = getDuration(lecture.startTime, lecture.endTime);
                    return (
                      <div
                        key={lecture._id}
                        className="absolute left-0 right-0 rounded bg-blue-500 p-1 text-xs text-white"
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                        }}
                        onClick={() => onLectureClick?.(lecture)}
                      >
                        <div className="font-medium">Lecture</div>
                        <div className="text-xs opacity-90">
                          {lecture.startTime} - {lecture.endTime}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Month view (simplified - just list view)
  return (
    <div className="space-y-4">
      {DAYS.map((day, dayIndex) => {
        const dayLectures = lecturesByDay[dayIndex] || [];
        if (dayLectures.length === 0) return null;
        return (
          <Card key={day}>
            <CardContent className="p-4">
              <h3 className="mb-2 font-semibold">{day}</h3>
              <div className="space-y-2">
                {dayLectures
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((lecture) => (
                    <div
                      key={lecture._id}
                      className="rounded bg-blue-50 p-2"
                      onClick={() => onLectureClick?.(lecture)}
                    >
                      <div className="text-sm font-medium">
                        {lecture.startTime} - {lecture.endTime}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
