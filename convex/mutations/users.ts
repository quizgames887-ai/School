import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal("admin"), v.literal("teacher")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("User with this email already exists");
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      passwordHash: args.passwordHash,
      role: args.role,
    });

    // If user is a teacher, automatically create a teacher profile
    if (args.role === "teacher") {
      // Check if teacher profile already exists (shouldn't happen, but safety check)
      const existingTeacher = await ctx.db
        .query("teachers")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .first();

      if (!existingTeacher) {
        await ctx.db.insert("teachers", {
          userId: userId,
          name: args.name,
          email: args.email,
          subjects: [], // Empty subjects array, can be assigned later
        });
      }
    }

    return userId;
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("teacher"))),
    passwordHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Check if email is being changed and if it already exists
    if (updates.email) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", updates.email!))
        .first();
      
      if (existing && existing._id !== id) {
        throw new Error("User with this email already exists");
      }
    }
    
    await ctx.db.patch(id, updates);
    return id;
  },
});

export const deleteUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    // Check if user has a teacher profile
    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_user_id", (q) => q.eq("userId", args.id))
      .first();
    
    if (teacher) {
      // Check if teacher has any lectures
      const lectures = await ctx.db
        .query("lectures")
        .withIndex("by_teacher", (q) => q.eq("teacherId", teacher._id))
        .first();
      
      if (lectures) {
        throw new Error("Cannot delete user with teacher profile that has existing lectures");
      }
      
      // Delete teacher profile first
      await ctx.db.delete(teacher._id);
    }
    
    // Delete user
    await ctx.db.delete(args.id);
    return args.id;
  },
});
