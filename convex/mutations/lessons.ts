import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    unitId: v.id("units"),
    name: v.string(),
    order: v.number(),
    duration: v.number(),
    prerequisites: v.array(v.id("lessons")),
  },
  handler: async (ctx, args) => {
    // Validate prerequisites are in the same unit or earlier units
    if (args.prerequisites.length > 0) {
      const unit = await ctx.db.get(args.unitId);
      if (!unit) {
        throw new Error("Unit not found");
      }
      
      // Get all lessons in the same subject
      const allUnits = await ctx.db
        .query("units")
        .withIndex("by_subject", (q) => q.eq("subjectId", unit.subjectId))
        .collect();
      
      const allLessons = await Promise.all(
        allUnits.flatMap((u) =>
          ctx.db
            .query("lessons")
            .withIndex("by_unit", (q) => q.eq("unitId", u._id))
            .collect()
        )
      );
      
      const flatLessons = allLessons.flat();
      
      // Validate all prerequisites exist
      for (const prereqId of args.prerequisites) {
        const prereq = flatLessons.find((l) => l._id === prereqId);
        if (!prereq) {
          throw new Error(`Prerequisite lesson ${prereqId} not found`);
        }
      }
    }
    
    return await ctx.db.insert("lessons", {
      unitId: args.unitId,
      name: args.name,
      order: args.order,
      duration: args.duration,
      prerequisites: args.prerequisites,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("lessons"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
    duration: v.optional(v.number()),
    prerequisites: v.optional(v.array(v.id("lessons"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Validate prerequisites if being updated
    if (updates.prerequisites !== undefined) {
      const lesson = await ctx.db.get(id);
      if (!lesson) {
        throw new Error("Lesson not found");
      }
      
      const unit = await ctx.db.get(lesson.unitId);
      if (!unit) {
        throw new Error("Unit not found");
      }
      
      // Get all lessons in the same subject
      const allUnits = await ctx.db
        .query("units")
        .withIndex("by_subject", (q) => q.eq("subjectId", unit.subjectId))
        .collect();
      
      const allLessons = await Promise.all(
        allUnits.flatMap((u) =>
          ctx.db
            .query("lessons")
            .withIndex("by_unit", (q) => q.eq("unitId", u._id))
            .collect()
        )
      );
      
      const flatLessons = allLessons.flat();
      
      // Validate all prerequisites exist and don't create circular dependencies
      for (const prereqId of updates.prerequisites) {
        if (prereqId === id) {
          throw new Error("Lesson cannot be a prerequisite of itself");
        }
        
        const prereq = flatLessons.find((l) => l._id === prereqId);
        if (!prereq) {
          throw new Error(`Prerequisite lesson ${prereqId} not found`);
        }
        
        // Check for circular dependencies
        if (prereq.prerequisites.includes(id)) {
          throw new Error("Circular dependency detected");
        }
      }
    }
    
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const deleteLesson = mutation({
  args: { id: v.id("lessons") },
  handler: async (ctx, args) => {
    // Check if lesson is used in any lectures
    const lectures = await ctx.db
      .query("lectures")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.id))
      .first();
    
    if (lectures) {
      throw new Error("Cannot delete lesson used in lectures");
    }
    
    // Check if lesson is a prerequisite of other lessons
    const allLessons = await ctx.db.query("lessons").collect();
    const dependentLessons = allLessons.filter((lesson) =>
      lesson.prerequisites.includes(args.id)
    );
    
    if (dependentLessons.length > 0) {
      // Remove this lesson from prerequisites
      await Promise.all(
        dependentLessons.map((lesson) =>
          ctx.db.patch(lesson._id, {
            prerequisites: lesson.prerequisites.filter((prereqId) => prereqId !== args.id),
          })
        )
      );
    }
    
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const reorder = mutation({
  args: {
    lessonIds: v.array(v.id("lessons")),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.lessonIds.map((id, index) =>
        ctx.db.patch(id, { order: index + 1 })
      )
    );
    return args.lessonIds;
  },
});
