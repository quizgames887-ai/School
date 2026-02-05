import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Seed mutation to create an admin user
// Password will be hashed using a simple method - should be upgraded on first login
export const createAdminUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Normalize email to lowercase for consistent lookups
    const normalizedEmail = args.email.trim().toLowerCase();
    
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existing) {
      // Update existing user's password
      // Use legacy hash for simplicity - will be upgraded to bcrypt on first login
      let hash = 0;
      for (let i = 0; i < args.password.length; i++) {
        const char = args.password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      const passwordHash = hash.toString(36);
      
      await ctx.db.patch(existing._id, { passwordHash });
      return { message: "Password updated for existing user", userId: existing._id };
    }

    // Create new admin user with legacy hash
    let hash = 0;
    for (let i = 0; i < args.password.length; i++) {
      const char = args.password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const passwordHash = hash.toString(36);

    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
      name: args.name,
      passwordHash,
      role: "admin",
    });

    return { message: "Admin user created", userId };
  },
});

// Migration mutation to normalize all existing user emails to lowercase
// Run this once to fix any existing users with uppercase emails
export const normalizeUserEmails = mutation({
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
    
    return { message: `Normalized ${updated} user emails to lowercase` };
  },
});
