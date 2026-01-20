"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";

export const validateSchedule = action({
  args: {
    teacherId: v.id("teachers"),
    sectionId: v.id("sections"), // Changed from classId to sectionId
    lessonId: v.id("lessons"),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    academicYear: v.string(),
    excludeLectureId: v.optional(v.id("lectures")),
  },
  handler: async (ctx, args): Promise<{
    valid: boolean;
    errors: string[];
    conflicts: boolean;
    teacherConflicts: Doc<"lectures">[];
    sectionConflicts: Doc<"lectures">[]; // Changed from classConflicts to sectionConflicts
    curriculumAlignment: boolean;
  }> => {
    const errors: string[] = [];
    
    // Check for time conflicts
    const conflicts: {
      teacherConflicts: Doc<"lectures">[];
      sectionConflicts: Doc<"lectures">[];
      hasConflicts: boolean;
    } = await ctx.runQuery(api.queries.conflicts.checkAllConflicts, {
      teacherId: args.teacherId,
      sectionId: args.sectionId,
      dayOfWeek: args.dayOfWeek,
      startTime: args.startTime,
      endTime: args.endTime,
      excludeLectureId: args.excludeLectureId,
      academicYear: args.academicYear,
    });
    
    if (conflicts.hasConflicts) {
      errors.push("Scheduling conflicts detected");
    }
    
    // Check curriculum alignment
    const lesson = await ctx.runQuery(api.queries.curriculum.getLessonWithPrerequisites, {
      lessonId: args.lessonId,
    });
    
    if (!lesson) {
      return {
        valid: false,
        errors: ["Lesson not found"],
        conflicts: conflicts.hasConflicts,
        teacherConflicts: conflicts.teacherConflicts,
        sectionConflicts: conflicts.sectionConflicts,
        curriculumAlignment: false,
      };
    }
    
    // Get teacher to check if they teach this subject
    const teacher = await ctx.runQuery(api.queries.teachers.getById, {
      id: args.teacherId,
    });
    
    if (!teacher) {
      return {
        valid: false,
        errors: ["Teacher not found"],
        conflicts: conflicts.hasConflicts,
        teacherConflicts: conflicts.teacherConflicts,
        sectionConflicts: conflicts.sectionConflicts,
        curriculumAlignment: false,
      };
    }
    
    // Get lesson's unit to find the subject
    const lessonData = await ctx.runQuery(api.queries.lessons.getById, {
      id: args.lessonId,
    });
    
    if (!lessonData) {
      return {
        valid: false,
        errors: ["Lesson data not found"],
        conflicts: conflicts.hasConflicts,
        teacherConflicts: conflicts.teacherConflicts,
        sectionConflicts: conflicts.sectionConflicts,
        curriculumAlignment: false,
      };
    }
    
    // Get the unit for this lesson
    const allUnits = await ctx.runQuery(api.queries.subjects.getAll, {});
    // We need to find which unit contains this lesson - simplified approach
    // In production, you'd query units and check which one has this lesson
    
    // For now, check if teacher teaches any subject (simplified)
    // In production, traverse: lesson -> unit -> subject, then check teacher.subjects
    
    // Check if prerequisites are scheduled before this lesson
    if (lesson.prerequisiteLessons && lesson.prerequisiteLessons.length > 0) {
      const allLectures = await ctx.runQuery(api.queries.lectures.getAll, {});
      const sectionLectures = allLectures.filter(
        (lecture: Doc<"lectures">) => lecture.sectionId === args.sectionId && lecture.academicYear === args.academicYear
      );
      
      const prerequisiteLectures = sectionLectures.filter((lecture: Doc<"lectures">) =>
        lesson.prerequisiteLessons!.some((prereq) => prereq && prereq._id === lecture.lessonId)
      );
      
      // Check if prerequisites are scheduled earlier in the week or earlier in the day
      const currentDayOrder = args.dayOfWeek;
      const currentTime = args.startTime;
      
      const missingPrerequisites = lesson.prerequisiteLessons.filter((prereq) => {
        if (!prereq) return true; // Skip null prerequisites
        const prereqLecture = prerequisiteLectures.find((l: Doc<"lectures">) => l.lessonId === prereq._id);
        if (!prereqLecture) {
          return true; // Prerequisite not scheduled
        }
        
        // Check if prerequisite is scheduled before this lesson
        if (prereqLecture.recurring) {
          if (prereqLecture.dayOfWeek < currentDayOrder) {
            return false; // Prerequisite is earlier in the week
          }
          if (prereqLecture.dayOfWeek === currentDayOrder && prereqLecture.startTime < currentTime) {
            return false; // Prerequisite is earlier in the same day
          }
        }
        
        return true; // Prerequisite is scheduled after or at the same time
      });
      
      if (missingPrerequisites.length > 0) {
        errors.push(
          `Prerequisites not met: ${missingPrerequisites.length} prerequisite lesson(s) must be scheduled before this lesson`
        );
      }
    }
    
    // Check lesson order within unit
    const unitLessons = await ctx.runQuery(api.queries.lessons.getByUnit, {
      unitId: lessonData.unitId,
    });
    
    const sortedLessons = unitLessons.sort((a: Doc<"lessons">, b: Doc<"lessons">) => a.order - b.order);
    const currentLessonIndex = sortedLessons.findIndex((l: Doc<"lessons">) => l._id === args.lessonId);
    
    if (currentLessonIndex > 0) {
      const previousLessons = sortedLessons.slice(0, currentLessonIndex);
      const previousLessonIds = previousLessons.map((l: Doc<"lessons">) => l._id);
      
      const sectionLectures = await ctx.runQuery(api.queries.lectures.getBySection, {
        sectionId: args.sectionId,
      });
      
      const scheduledPreviousLessons = sectionLectures.filter((lecture: Doc<"lectures">) =>
        previousLessonIds.includes(lecture.lessonId) && lecture.academicYear === args.academicYear
      );
      
      if (scheduledPreviousLessons.length < previousLessons.length) {
        errors.push(
          "Previous lessons in the unit must be scheduled before this lesson"
        );
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      conflicts: conflicts.hasConflicts,
      teacherConflicts: conflicts.teacherConflicts,
      sectionConflicts: conflicts.sectionConflicts,
      curriculumAlignment: errors.filter((e) => e.includes("Prerequisite") || e.includes("Previous")).length === 0,
    };
  },
});
