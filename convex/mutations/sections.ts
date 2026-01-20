import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    grade: v.string(),
    numberOfStudents: v.number(),
    academicYear: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sections", {
      name: args.name,
      grade: args.grade,
      numberOfStudents: args.numberOfStudents,
      academicYear: args.academicYear,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("sections"),
    name: v.optional(v.string()),
    grade: v.optional(v.string()),
    numberOfStudents: v.optional(v.number()),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const deleteSection = mutation({
  args: { id: v.id("sections") },
  handler: async (ctx, args) => {
    // Check if section has class sessions
    const classSessions = await ctx.db
      .query("classSessions")
      .withIndex("by_section", (q) => q.eq("sectionId", args.id))
      .first();
    
    if (classSessions) {
      throw new Error("Cannot delete section with existing class sessions");
    }
    
    await ctx.db.delete(args.id);
    return args.id;
  },
});
