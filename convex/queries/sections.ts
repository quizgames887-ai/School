import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sections").collect();
  },
});

export const getById = query({
  args: { id: v.id("sections") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByGrade = query({
  args: {
    grade: v.string(),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("sections")
      .withIndex("by_grade", (q) => q.eq("grade", args.grade));
    
    const sections = await query.collect();
    
    if (args.academicYear) {
      return sections.filter((s) => s.academicYear === args.academicYear);
    }
    
    return sections;
  },
});

export const getByAcademicYear = query({
  args: {
    academicYear: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sections")
      .withIndex("by_academic_year", (q) => q.eq("academicYear", args.academicYear))
      .collect();
  },
});
