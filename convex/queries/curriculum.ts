import { query } from "../_generated/server";
import { v } from "convex/values";

export const getFullCurriculum = query({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    
    const subjectsWithUnits = await Promise.all(
      subjects.map(async (subject) => {
        const units = await ctx.db
          .query("units")
          .withIndex("by_subject", (q) => q.eq("subjectId", subject._id))
          .collect();
        
        const unitsWithLessons = await Promise.all(
          units.map(async (unit) => {
            const lessons = await ctx.db
              .query("lessons")
              .withIndex("by_unit", (q) => q.eq("unitId", unit._id))
              .collect();
            return {
              ...unit,
              lessons: lessons.sort((a, b) => a.order - b.order),
            };
          })
        );
        
        return {
          ...subject,
          units: unitsWithLessons.sort((a, b) => a.order - b.order),
        };
      })
    );
    
    return subjectsWithUnits;
  },
});

export const getSubjectCurriculum = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const subject = await ctx.db.get(args.subjectId);
    if (!subject) return null;

    const units = await ctx.db
      .query("units")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();

    const unitsWithLessons = await Promise.all(
      units.map(async (unit) => {
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("by_unit", (q) => q.eq("unitId", unit._id))
          .collect();
        return {
          ...unit,
          lessons: lessons.sort((a, b) => a.order - b.order),
        };
      })
    );

    return {
      ...subject,
      units: unitsWithLessons.sort((a, b) => a.order - b.order),
    };
  },
});

export const getLessonWithPrerequisites = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) return null;

    const prerequisites = await Promise.all(
      lesson.prerequisites.map((prereqId) => ctx.db.get(prereqId))
    );

    return {
      ...lesson,
      prerequisiteLessons: prerequisites.filter(Boolean),
    };
  },
});
