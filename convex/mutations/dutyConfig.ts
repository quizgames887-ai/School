import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    academicYear: v.string(),
    workingDays: v.array(v.number()),
    weekStartDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dutyConfig")
      .withIndex("by_academic_year", (q) => q.eq("academicYear", args.academicYear))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        workingDays: args.workingDays,
        weekStartDate: args.weekStartDate,
      });
      return existing._id;
    }
    return await ctx.db.insert("dutyConfig", {
      academicYear: args.academicYear,
      workingDays: args.workingDays,
      weekStartDate: args.weekStartDate,
    });
  },
});
