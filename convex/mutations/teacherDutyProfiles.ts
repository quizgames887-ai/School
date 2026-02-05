import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const upsert = mutation({
  args: {
    teacherId: v.id("teachers"),
    academicYear: v.string(),
    teachingLoadOverride: v.optional(v.number()),
    availableDays: v.array(v.number()),
    maxDutiesPerWeek: v.number(),
    maxDutiesPerDay: v.number(),
    excludeDays: v.optional(v.array(v.number())),
    excludeDutyTypeIds: v.optional(v.array(v.id("dutyTypes"))),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("teacherDutyProfiles")
      .withIndex("by_teacher", (q) =>
        q.eq("teacherId", args.teacherId).eq("academicYear", args.academicYear)
      )
      .first();
    const doc = {
      teacherId: args.teacherId,
      academicYear: args.academicYear,
      teachingLoadOverride: args.teachingLoadOverride,
      availableDays: args.availableDays,
      maxDutiesPerWeek: args.maxDutiesPerWeek,
      maxDutiesPerDay: args.maxDutiesPerDay,
      excludeDays: args.excludeDays,
      excludeDutyTypeIds: args.excludeDutyTypeIds,
    };
    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }
    return await ctx.db.insert("teacherDutyProfiles", doc);
  },
});

export const remove = mutation({
  args: { id: v.id("teacherDutyProfiles") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
