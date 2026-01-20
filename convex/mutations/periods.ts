import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    nameAr: v.optional(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    isBreak: v.boolean(),
    order: v.number(),
    academicYear: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate time format
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(args.startTime) || !timeRegex.test(args.endTime)) {
      throw new Error("Invalid time format. Use HH:mm format");
    }

    // Validate start time is before end time
    const [startHours, startMinutes] = args.startTime.split(":").map(Number);
    const [endHours, endMinutes] = args.endTime.split(":").map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;

    if (startTotal >= endTotal) {
      throw new Error("Start time must be before end time");
    }

    return await ctx.db.insert("periods", {
      name: args.name,
      nameAr: args.nameAr,
      startTime: args.startTime,
      endTime: args.endTime,
      isBreak: args.isBreak,
      order: args.order,
      academicYear: args.academicYear,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("periods"),
    name: v.optional(v.string()),
    nameAr: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    isBreak: v.optional(v.boolean()),
    order: v.optional(v.number()),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Validate time format if provided
    if (updates.startTime || updates.endTime) {
      const period = await ctx.db.get(id);
      if (!period) {
        throw new Error("Period not found");
      }

      const startTime = updates.startTime || period.startTime;
      const endTime = updates.endTime || period.endTime;

      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        throw new Error("Invalid time format. Use HH:mm format");
      }

      // Validate start time is before end time
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      const startTotal = startHours * 60 + startMinutes;
      const endTotal = endHours * 60 + endMinutes;

      if (startTotal >= endTotal) {
        throw new Error("Start time must be before end time");
      }
    }

    await ctx.db.patch(id, updates);
    return id;
  },
});

export const deletePeriod = mutation({
  args: { id: v.id("periods") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
