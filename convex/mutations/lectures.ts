import { mutation } from "../_generated/server";
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

export const create = mutation({
  args: {
    teacherId: v.id("teachers"),
    sectionId: v.id("sections"), // Changed from classId to sectionId
    lessonId: v.id("lessons"),
    startTime: v.string(),
    endTime: v.string(),
    dayOfWeek: v.number(),
    recurring: v.boolean(),
    date: v.optional(v.string()),
    academicYear: v.string(),
    periodId: v.optional(v.id("periods")),
  },
  handler: async (ctx, args) => {
    // If periodId is provided, validate it exists and sync times
    let finalStartTime = args.startTime;
    let finalEndTime = args.endTime;
    
    if (args.periodId) {
      const period = await ctx.db.get(args.periodId);
      if (!period) {
        throw new Error("Period not found");
      }
      if (period.isBreak) {
        throw new Error("Cannot assign lecture to a break period");
      }
      // Sync times from period if periodId is provided
      finalStartTime = period.startTime;
      finalEndTime = period.endTime;
    }
    
    // Validate times
    if (finalStartTime >= finalEndTime) {
      throw new Error("Start time must be before end time");
    }
    
    // Check for conflicts if recurring
    if (args.recurring) {
      const teacherLectures = await ctx.db
        .query("lectures")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
        .collect();
      
      // Query all lectures and filter by sectionId (index removed because sectionId is optional)
      const allLectures = await ctx.db.query("lectures").collect();
      const sectionLectures = allLectures.filter((lecture) => lecture.sectionId === args.sectionId);
      
      const teacherConflicts = teacherLectures.filter(
        (lecture) =>
          lecture.recurring &&
          lecture.academicYear === args.academicYear &&
          lecture.dayOfWeek === args.dayOfWeek &&
          timesOverlap(
            finalStartTime,
            finalEndTime,
            lecture.startTime,
            lecture.endTime
          )
      );
      
      const sectionConflicts = sectionLectures.filter(
        (lecture) =>
          lecture.recurring &&
          lecture.academicYear === args.academicYear &&
          lecture.dayOfWeek === args.dayOfWeek &&
          timesOverlap(
            finalStartTime,
            finalEndTime,
            lecture.startTime,
            lecture.endTime
          )
      );
      
      if (teacherConflicts.length > 0 || sectionConflicts.length > 0) {
        throw new Error(
          "Scheduling conflict detected. Teacher or section is already scheduled at this time."
        );
      }
    }
    
    return await ctx.db.insert("lectures", {
      teacherId: args.teacherId,
      sectionId: args.sectionId, // New lectures always use sectionId
      lessonId: args.lessonId,
      startTime: finalStartTime,
      endTime: finalEndTime,
      dayOfWeek: args.dayOfWeek,
      recurring: args.recurring,
      date: args.date,
      academicYear: args.academicYear,
      periodId: args.periodId,
      // classId is not set for new lectures - only sectionId
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("lectures"),
    teacherId: v.optional(v.id("teachers")),
    sectionId: v.optional(v.id("sections")), // Changed from classId to sectionId
    lessonId: v.optional(v.id("lessons")),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    dayOfWeek: v.optional(v.number()),
    recurring: v.optional(v.boolean()),
    date: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    periodId: v.optional(v.id("periods")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    
    if (!existing) {
      throw new Error("Lecture not found");
    }
    
    // If periodId is being set/updated, validate it and sync times
    if (updates.periodId !== undefined) {
      if (updates.periodId) {
        const period = await ctx.db.get(updates.periodId);
        if (!period) {
          throw new Error("Period not found");
        }
        if (period.isBreak) {
          throw new Error("Cannot assign lecture to a break period");
        }
        // Sync times from period
        updates.startTime = period.startTime;
        updates.endTime = period.endTime;
      } else {
        // periodId is being cleared, keep existing times
        // Don't modify startTime/endTime
      }
    }
    
    // Validate times if being updated
    if (updates.startTime !== undefined || updates.endTime !== undefined) {
      const startTime = updates.startTime ?? existing.startTime;
      const endTime = updates.endTime ?? existing.endTime;
      
      if (startTime >= endTime) {
        throw new Error("Start time must be before end time");
      }
    }
    
    // Check for conflicts if recurring and time/day is being changed
    const recurring = updates.recurring ?? existing.recurring;
    const dayOfWeek = updates.dayOfWeek ?? existing.dayOfWeek;
    const startTime = updates.startTime ?? existing.startTime;
    const endTime = updates.endTime ?? existing.endTime;
    const teacherId = updates.teacherId ?? existing.teacherId;
    const sectionId = updates.sectionId ?? existing.sectionId;
    const academicYear = updates.academicYear ?? existing.academicYear;
    
    if (recurring && (updates.startTime || updates.endTime || updates.dayOfWeek || updates.teacherId || updates.sectionId)) {
      const teacherLectures = await ctx.db
        .query("lectures")
        .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId))
        .collect();
      
      // Query all lectures and filter by sectionId (index removed because sectionId is optional)
      const allLectures = await ctx.db.query("lectures").collect();
      const sectionLectures = allLectures.filter((lecture) => lecture.sectionId === sectionId);
      
      const teacherConflicts = teacherLectures.filter(
        (lecture) =>
          lecture._id !== id &&
          lecture.recurring &&
          lecture.academicYear === academicYear &&
          lecture.dayOfWeek === dayOfWeek &&
          timesOverlap(startTime, endTime, lecture.startTime, lecture.endTime)
      );
      
      const sectionConflicts = sectionLectures.filter(
        (lecture) =>
          lecture._id !== id &&
          lecture.recurring &&
          lecture.academicYear === academicYear &&
          lecture.dayOfWeek === dayOfWeek &&
          timesOverlap(startTime, endTime, lecture.startTime, lecture.endTime)
      );
      
      if (teacherConflicts.length > 0 || sectionConflicts.length > 0) {
        throw new Error(
          "Scheduling conflict detected. Teacher or section is already scheduled at this time."
        );
      }
    }
    
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const deleteLecture = mutation({
  args: { id: v.id("lectures") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
