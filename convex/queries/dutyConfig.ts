import { query } from "../_generated/server";
import { v } from "convex/values";

export const getByAcademicYear = query({
  args: { academicYear: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dutyConfig")
      .withIndex("by_academic_year", (q) => q.eq("academicYear", args.academicYear))
      .first();
  },
});
