import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("classes").collect();
  },
});

export const getById = query({
  args: { id: v.id("classes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByAcademicYear = query({
  args: { academicYear: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("classes")
      .withIndex("by_academic_year", (q) => q.eq("academicYear", args.academicYear))
      .collect();
  },
});
