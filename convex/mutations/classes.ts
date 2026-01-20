import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    grade: v.string(),
    academicYear: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("classes", {
      name: args.name,
      grade: args.grade,
      academicYear: args.academicYear,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("classes"),
    name: v.optional(v.string()),
    grade: v.optional(v.string()),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const deleteClass = mutation({
  args: { id: v.id("classes") },
  handler: async (ctx, args) => {
    // Note: Lectures now use sectionId instead of classId
    // Classes table is kept for backward compatibility but is no longer used by lectures
    // This check is no longer needed, but kept for safety
    // In the future, this mutation might be deprecated
    
    await ctx.db.delete(args.id);
    return args.id;
  },
});
