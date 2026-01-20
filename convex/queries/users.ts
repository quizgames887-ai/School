import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    // Enrich users with their teacher profiles
    const usersWithTeachers = await Promise.all(
      users.map(async (user) => {
        const teacher = await ctx.db
          .query("teachers")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .first();
        
        return {
          ...user,
          teacherProfile: teacher || null,
        };
      })
    );
    
    return usersWithTeachers;
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    
    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .first();
    
    return {
      ...user,
      teacherProfile: teacher || null,
    };
  },
});
