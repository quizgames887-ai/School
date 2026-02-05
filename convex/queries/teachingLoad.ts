import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Returns per-teacher lecture count per week (recurring lectures only) for an academic year.
 * Used by duty roster algorithm and UI.
 */
export const getLecturesPerWeekByTeacher = query({
  args: { academicYear: v.string() },
  handler: async (ctx, args) => {
    const lectures = await ctx.db
      .query("lectures")
      .withIndex("by_academic_year", (q) => q.eq("academicYear", args.academicYear))
      .collect();
    const recurring = lectures.filter((l) => l.recurring);
    const byTeacher = new Map<string, number>();
    for (const l of recurring) {
      const id = l.teacherId;
      byTeacher.set(id, (byTeacher.get(id) ?? 0) + 1);
    }
    return Object.fromEntries(byTeacher);
  },
});
