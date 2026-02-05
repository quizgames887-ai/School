import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    requiredTeachers: v.number(),
    timeSlot: v.optional(v.string()),
    periodId: v.optional(v.id("periods")),
    academicYear: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dutyTypes", {
      name: args.name,
      requiredTeachers: args.requiredTeachers,
      timeSlot: args.timeSlot,
      periodId: args.periodId,
      academicYear: args.academicYear,
      order: args.order,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("dutyTypes"),
    name: v.optional(v.string()),
    requiredTeachers: v.optional(v.number()),
    timeSlot: v.optional(v.string()),
    periodId: v.optional(v.id("periods")),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("dutyTypes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
