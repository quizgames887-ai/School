import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Create a new translation
export const create = mutation({
  args: {
    key: v.string(),
    category: v.string(),
    en: v.string(),
    ar: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if key already exists
    const existing = await ctx.db
      .query("translations")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      throw new Error(`Translation with key "${args.key}" already exists`);
    }

    return await ctx.db.insert("translations", {
      key: args.key,
      category: args.category,
      en: args.en,
      ar: args.ar,
    });
  },
});

// Update an existing translation
export const update = mutation({
  args: {
    id: v.id("translations"),
    key: v.optional(v.string()),
    category: v.optional(v.string()),
    en: v.optional(v.string()),
    ar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // If key is being changed, check it doesn't already exist
    if (updates.key) {
      const existing = await ctx.db
        .query("translations")
        .withIndex("by_key", (q) => q.eq("key", updates.key!))
        .first();

      if (existing && existing._id !== id) {
        throw new Error(`Translation with key "${updates.key}" already exists`);
      }
    }

    await ctx.db.patch(id, updates);
    return id;
  },
});

// Delete a translation
export const remove = mutation({
  args: { id: v.id("translations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Bulk create translations (for seeding)
export const bulkCreate = mutation({
  args: {
    translations: v.array(
      v.object({
        key: v.string(),
        category: v.string(),
        en: v.string(),
        ar: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const translation of args.translations) {
      // Check if key already exists
      const existing = await ctx.db
        .query("translations")
        .withIndex("by_key", (q) => q.eq("key", translation.key))
        .first();

      if (existing) {
        // Update existing translation
        await ctx.db.patch(existing._id, {
          category: translation.category,
          en: translation.en,
          ar: translation.ar,
        });
        ids.push(existing._id);
      } else {
        // Create new translation
        const id = await ctx.db.insert("translations", translation);
        ids.push(id);
      }
    }
    return ids;
  },
});

// Set app language
export const setLanguage = mutation({
  args: { language: v.union(v.literal("en"), v.literal("ar")) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "language"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.language });
      return existing._id;
    } else {
      return await ctx.db.insert("appSettings", {
        key: "language",
        value: args.language,
      });
    }
  },
});
