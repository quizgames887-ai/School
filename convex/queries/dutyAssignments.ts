import { query } from "../_generated/server";
import { v } from "convex/values";

export const getByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("dutyAssignments")
      .withIndex("by_date", (q) =>
        q.gte("date", args.startDate).lte("date", args.endDate)
      )
      .collect();
    if (args.academicYear) {
      return list.filter((a) => a.academicYear === args.academicYear);
    }
    return list;
  },
});

export const getByWeekStart = query({
  args: {
    weekStartDate: v.string(), // YYYY-MM-DD (e.g. Sunday)
    academicYear: v.string(),
  },
  handler: async (ctx, args) => {
    const start = new Date(args.weekStartDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const all = await ctx.db.query("dutyAssignments").collect();
    return all.filter(
      (a) =>
        a.date >= startStr &&
        a.date <= endStr &&
        a.academicYear === args.academicYear
    );
  },
});

export const getByTeacherAndDate = query({
  args: {
    teacherId: v.id("teachers"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dutyAssignments")
      .withIndex("by_teacher", (q) =>
        q.eq("teacherId", args.teacherId).eq("date", args.date)
      )
      .collect();
  },
});
