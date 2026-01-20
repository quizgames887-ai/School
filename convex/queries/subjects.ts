import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("subjects").collect();
  },
});

export const getById = query({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithUnitsAndLessons = query({
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
        return { ...unit, lessons: lessons.sort((a, b) => a.order - b.order) };
      })
    );

    return {
      ...subject,
      units: unitsWithLessons.sort((a, b) => a.order - b.order),
    };
  },
});
