import { query } from "../_generated/server";
import { v } from "convex/values";

export const getByAcademicYear = query({
  args: { academicYear: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teacherDutyProfiles")
      .withIndex("by_academic_year", (q) => q.eq("academicYear", args.academicYear))
      .collect();
  },
});

export const getByTeacher = query({
  args: { teacherId: v.id("teachers"), academicYear: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teacherDutyProfiles")
      .withIndex("by_teacher", (q) =>
        q.eq("teacherId", args.teacherId).eq("academicYear", args.academicYear)
      )
      .first();
  },
});
