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
    // Normalize email to lowercase for consistent lookups
    const normalizedEmail = args.email.trim().toLowerCase();
    
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existing) {
      throw new Error("User with this email already exists");
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
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
          email: normalizedEmail,
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
    photoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Get current user to check role change
    const currentUser = await ctx.db.get(id);
    if (!currentUser) {
      throw new Error("User not found");
    }
    
    // Normalize email if it's being updated
    if (updates.email) {
      updates.email = updates.email.trim().toLowerCase();
      
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", updates.email!))
        .first();
      
      if (existing && existing._id !== id) {
        throw new Error("User with this email already exists");
      }
    }
    
    // Update user
    await ctx.db.patch(id, updates);
    
    // If role is being changed to "teacher", create teacher profile if it doesn't exist
    if (updates.role === "teacher" && currentUser.role !== "teacher") {
      const existingTeacher = await ctx.db
        .query("teachers")
        .withIndex("by_user_id", (q) => q.eq("userId", id))
        .first();

      if (!existingTeacher) {
        await ctx.db.insert("teachers", {
          userId: id,
          name: updates.name || currentUser.name,
          email: updates.email || currentUser.email,
          subjects: [], // Empty subjects array, can be assigned later
        });
      }
    }
    
    return id;
  },
});

// Migration mutation to normalize all existing user emails to lowercase
export const normalizeEmails = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let updated = 0;
    
    for (const user of users) {
      const normalizedEmail = user.email.trim().toLowerCase();
      if (user.email !== normalizedEmail) {
        await ctx.db.patch(user._id, { email: normalizedEmail });
        updated++;
        
        // Also update teacher profile email if it exists
        const teacher = await ctx.db
          .query("teachers")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .first();
        
        if (teacher && teacher.email !== normalizedEmail) {
          await ctx.db.patch(teacher._id, { email: normalizedEmail });
        }
      }
    }
    
    return { message: `Normalized ${updated} user emails to lowercase`, updated };
  },
});

// Generate upload URL for user photo
export const generatePhotoUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Update user photo
export const updatePhoto = mutation({
  args: {
    id: v.id("users"),
    photoId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete old photo if exists
    if (user.photoId) {
      await ctx.storage.delete(user.photoId);
    }

    // Update user with new photo
    await ctx.db.patch(args.id, { photoId: args.photoId });
    
    return args.id;
  },
});

// Delete user photo
export const deletePhoto = mutation({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.photoId) {
      await ctx.storage.delete(user.photoId);
      await ctx.db.patch(args.id, { photoId: undefined });
    }
    
    return args.id;
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
