import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("subjects", {
      name: args.name,
      description: args.description,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("subjects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const deleteSubject = mutation({
  args: { id: v.id("subjects") },
  handler: async (ctx, args) => {
    // Check if subject has units
    const units = await ctx.db
      .query("units")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.id))
      .first();
    
    if (units) {
      throw new Error("Cannot delete subject with existing units");
    }
    
    // Check if any teachers are assigned to this subject
    const teachers = await ctx.db.query("teachers").collect();
    const teachersWithSubject = teachers.filter((teacher) =>
      teacher.subjects.includes(args.id)
    );
    
    if (teachersWithSubject.length > 0) {
      throw new Error("Cannot delete subject assigned to teachers");
    }
    
    await ctx.db.delete(args.id);
    return args.id;
  },
});
