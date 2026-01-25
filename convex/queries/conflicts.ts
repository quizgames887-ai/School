import { query } from "../_generated/server";
import { v } from "convex/values";

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  
  return s1 < e2 && s2 < e1;
}

export const checkTeacherConflict = query({
  args: {
    teacherId: v.id("teachers"),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    excludeLectureId: v.optional(v.id("lectures")),
    academicYear: v.string(),
  },
  handler: async (ctx, args) => {
    const lectures = await ctx.db
      .query("lectures")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    const conflicts = lectures.filter((lecture) => {
      if (lecture.academicYear !== args.academicYear) return false;
      if (lecture.dayOfWeek !== args.dayOfWeek) return false;
      if (args.excludeLectureId && lecture._id === args.excludeLectureId) {
        return false;
      }
      
      // For recurring lectures, check time overlap
      if (lecture.recurring) {
        return timesOverlap(
          args.startTime,
          args.endTime,
          lecture.startTime,
          lecture.endTime
        );
      }
      
      return false;
    });

    return conflicts;
  },
});

export const checkSectionConflict = query({
  args: {
    sectionId: v.id("sections"),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    excludeLectureId: v.optional(v.id("lectures")),
    academicYear: v.string(),
  },
  handler: async (ctx, args) => {
    // Query all lectures and filter by sectionId (handles optional sectionId in schema)
    const allLectures = await ctx.db.query("lectures").collect();
    const lectures = allLectures.filter((lecture) => 
      lecture.sectionId === args.sectionId || 
      // For backward compatibility: if lecture has classId, check if it matches a section
      (lecture.classId && lecture.sectionId === undefined)
    );

    const conflicts = lectures.filter((lecture) => {
      // Match by sectionId (new data) or check if classId matches section (old data)
      const matchesSection = lecture.sectionId === args.sectionId;
      if (!matchesSection && lecture.classId) {
        // For old data with classId, we'd need to check if class matches section
        // For now, we'll only check exact sectionId matches
        return false;
      }
      if (!matchesSection) return false;
      
      if (lecture.academicYear !== args.academicYear) return false;
      if (lecture.dayOfWeek !== args.dayOfWeek) return false;
      if (args.excludeLectureId && lecture._id === args.excludeLectureId) {
        return false;
      }
      
      if (lecture.recurring) {
        return timesOverlap(
          args.startTime,
          args.endTime,
          lecture.startTime,
          lecture.endTime
        );
      }
      
      return false;
    });

    return conflicts;
  },
});

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const checkAllConflicts = query({
  args: {
    teacherId: v.id("teachers"),
    sectionId: v.id("sections"), // Changed from classId to sectionId
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    excludeLectureId: v.optional(v.id("lectures")),
    academicYear: v.string(),
  },
  handler: async (ctx, args) => {
    // Check teacher conflicts
    const teacherLectures = await ctx.db
      .query("lectures")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    const teacherConflictsRaw = teacherLectures.filter((lecture) => {
      if (lecture.academicYear !== args.academicYear) return false;
      if (lecture.dayOfWeek !== args.dayOfWeek) return false;
      if (args.excludeLectureId && lecture._id === args.excludeLectureId) {
        return false;
      }
      
      // For recurring lectures, check time overlap
      if (lecture.recurring) {
        return timesOverlap(
          args.startTime,
          args.endTime,
          lecture.startTime,
          lecture.endTime
        );
      }
      
      return false;
    });

    // Check section conflicts - query all and filter (handles optional sectionId in schema)
    const allLectures = await ctx.db.query("lectures").collect();
    const sectionLectures = allLectures.filter((lecture) => lecture.sectionId === args.sectionId);

    const sectionConflictsRaw = sectionLectures.filter((lecture) => {
      if (lecture.academicYear !== args.academicYear) return false;
      if (lecture.dayOfWeek !== args.dayOfWeek) return false;
      if (args.excludeLectureId && lecture._id === args.excludeLectureId) {
        return false;
      }
      
      if (lecture.recurring) {
        return timesOverlap(
          args.startTime,
          args.endTime,
          lecture.startTime,
          lecture.endTime
        );
      }
      
      return false;
    });

    // Enrich teacher conflicts with details
    const teacherConflicts = await Promise.all(
      teacherConflictsRaw.map(async (lecture) => {
        // Get section info
        let sectionName = "Unknown";
        if (lecture.sectionId) {
          const section = await ctx.db.get(lecture.sectionId);
          if (section) {
            sectionName = `${section.name} - ${section.grade}`;
          }
        }
        
        // Get lesson/subject info
        let subjectName = "Unknown";
        if (lecture.lessonId) {
          const lesson = await ctx.db.get(lecture.lessonId);
          if (lesson && lesson.unitId) {
            const unit = await ctx.db.get(lesson.unitId);
            if (unit && unit.subjectId) {
              const subject = await ctx.db.get(unit.subjectId);
              if (subject) {
                subjectName = subject.name;
              }
            }
          }
        }

        // Get period info
        let periodName = "";
        if (lecture.periodId) {
          const period = await ctx.db.get(lecture.periodId);
          if (period) {
            periodName = period.name;
          }
        }

        return {
          ...lecture,
          sectionName,
          subjectName,
          periodName,
          dayName: DAYS[lecture.dayOfWeek] || "Unknown",
        };
      })
    );

    // Enrich section conflicts with details
    const sectionConflicts = await Promise.all(
      sectionConflictsRaw.map(async (lecture) => {
        // Get teacher info
        let teacherName = "Unknown";
        if (lecture.teacherId) {
          const teacher = await ctx.db.get(lecture.teacherId);
          if (teacher) {
            teacherName = teacher.name;
          }
        }
        
        // Get lesson/subject info
        let subjectName = "Unknown";
        if (lecture.lessonId) {
          const lesson = await ctx.db.get(lecture.lessonId);
          if (lesson && lesson.unitId) {
            const unit = await ctx.db.get(lesson.unitId);
            if (unit && unit.subjectId) {
              const subject = await ctx.db.get(unit.subjectId);
              if (subject) {
                subjectName = subject.name;
              }
            }
          }
        }

        // Get period info
        let periodName = "";
        if (lecture.periodId) {
          const period = await ctx.db.get(lecture.periodId);
          if (period) {
            periodName = period.name;
          }
        }

        return {
          ...lecture,
          teacherName,
          subjectName,
          periodName,
          dayName: DAYS[lecture.dayOfWeek] || "Unknown",
        };
      })
    );

    return {
      teacherConflicts,
      sectionConflicts, // Changed from classConflicts to sectionConflicts
      hasConflicts: teacherConflicts.length > 0 || sectionConflicts.length > 0,
    };
  },
});
