import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    subjectId: v.id("subjects"),
    name: v.string(),
    order: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("units", {
      subjectId: args.subjectId,
      name: args.name,
      order: args.order,
      description: args.description,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("units"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const deleteUnit = mutation({
  args: { id: v.id("units") },
  handler: async (ctx, args) => {
    // Check if unit has lessons
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_unit", (q) => q.eq("unitId", args.id))
      .first();
    
    if (lessons) {
      throw new Error("Cannot delete unit with existing lessons");
    }
    
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const reorder = mutation({
  args: {
    unitIds: v.array(v.id("units")),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.unitIds.map((id, index) =>
        ctx.db.patch(id, { order: index + 1 })
      )
    );
    return args.unitIds;
  },
});
