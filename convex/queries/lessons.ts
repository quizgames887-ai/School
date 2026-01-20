import { query } from "../_generated/server";
import { v } from "convex/values";

export const getById = query({
  args: { id: v.id("lessons") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByUnit = query({
  args: { unitId: v.id("units") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_unit", (q) => q.eq("unitId", args.unitId))
      .collect();
  },
});
