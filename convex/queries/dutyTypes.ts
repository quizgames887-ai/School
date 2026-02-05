import { query } from "../_generated/server";
import { v } from "convex/values";

export const getByAcademicYear = query({
  args: { academicYear: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dutyTypes")
      .withIndex("by_academic_year", (q) => q.eq("academicYear", args.academicYear))
      .collect()
      .then((list) => list.sort((a, b) => a.order - b.order));
  },
});

export const getById = query({
  args: { id: v.id("dutyTypes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
