import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    sectionId: v.id("sections"),
    curriculumId: v.id("subjects"),
    teacherId: v.id("teachers"),
    date: v.string(),
    time: v.string(),
    endTime: v.optional(v.string()),
    academicYear: v.string(),
    periodId: v.optional(v.id("periods")),
    recurring: v.optional(v.boolean()),
    dayOfWeek: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // If periodId is provided, validate it exists and sync time
    let finalTime = args.time;
    let finalEndTime = args.endTime;
    
    if (args.periodId) {
      const period = await ctx.db.get(args.periodId);
      if (!period) {
        throw new Error("Period not found");
      }
      if (period.isBreak) {
        throw new Error("Cannot assign class session to a break period");
      }
      // Sync times from period if periodId is provided
      finalTime = period.startTime;
      finalEndTime = period.endTime;
    }
    
    // Validate times if endTime is provided
    if (finalEndTime && finalTime >= finalEndTime) {
      throw new Error("Start time must be before end time");
    }
    
    return await ctx.db.insert("classSessions", {
      sectionId: args.sectionId,
      curriculumId: args.curriculumId,
      teacherId: args.teacherId,
      date: args.date,
      time: finalTime,
      endTime: finalEndTime,
      academicYear: args.academicYear,
      periodId: args.periodId,
      recurring: args.recurring ?? false,
      dayOfWeek: args.dayOfWeek,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("classSessions"),
    sectionId: v.optional(v.id("sections")),
    curriculumId: v.optional(v.id("subjects")),
    teacherId: v.optional(v.id("teachers")),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    endTime: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    periodId: v.optional(v.id("periods")),
    recurring: v.optional(v.boolean()),
    dayOfWeek: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    
    if (!existing) {
      throw new Error("Class session not found");
    }
    
    // If periodId is being set/updated, validate it and sync times
    if (updates.periodId !== undefined) {
      if (updates.periodId) {
        const period = await ctx.db.get(updates.periodId);
        if (!period) {
          throw new Error("Period not found");
        }
        if (period.isBreak) {
          throw new Error("Cannot assign class session to a break period");
        }
        // Sync times from period
        updates.time = period.startTime;
        updates.endTime = period.endTime;
      }
    }
    
    // Validate times if being updated
    if (updates.time !== undefined || updates.endTime !== undefined) {
      const time = updates.time ?? existing.time;
      const endTime = updates.endTime ?? existing.endTime;
      
      if (endTime && time >= endTime) {
        throw new Error("Start time must be before end time");
      }
    }
    
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const deleteClassSession = mutation({
  args: { id: v.id("classSessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
