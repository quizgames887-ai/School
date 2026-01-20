import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    subjects: v.array(v.id("subjects")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("teachers", {
      userId: args.userId,
      name: args.name,
      email: args.email,
      subjects: args.subjects,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("teachers"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    subjects: v.optional(v.array(v.id("subjects"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const deleteTeacher = mutation({
  args: { id: v.id("teachers") },
  handler: async (ctx, args) => {
    // Check if teacher has any lectures
    const lectures = await ctx.db
      .query("lectures")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.id))
      .first();
    
    if (lectures) {
      throw new Error("Cannot delete teacher with existing lectures");
    }
    
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const assignSubject = mutation({
  args: {
    teacherId: v.id("teachers"),
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }
    
    if (!teacher.subjects.includes(args.subjectId)) {
      await ctx.db.patch(args.teacherId, {
        subjects: [...teacher.subjects, args.subjectId],
      });
    }
    
    return args.teacherId;
  },
});

export const removeSubject = mutation({
  args: {
    teacherId: v.id("teachers"),
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }
    
    await ctx.db.patch(args.teacherId, {
      subjects: teacher.subjects.filter((id) => id !== args.subjectId),
    });
    
    return args.teacherId;
  },
});
