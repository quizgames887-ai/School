import { query } from "../_generated/server";
import { v } from "convex/values";

// Get all translations
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("translations").collect();
  },
});

// Get translations by category
export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("translations")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

// Get a single translation by key
export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("translations")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

// Get all translations as a map for efficient lookup
export const getAllAsMap = query({
  args: {},
  handler: async (ctx) => {
    const translations = await ctx.db.query("translations").collect();
    const map: Record<string, { en: string; ar: string }> = {};
    for (const t of translations) {
      map[t.key] = { en: t.en, ar: t.ar };
    }
    return map;
  },
});

// Get app language setting
export const getLanguageSetting = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "language"))
      .first();
    return setting?.value || "en";
  },
});

// Get all categories
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const translations = await ctx.db.query("translations").collect();
    const categories = new Set<string>();
    for (const t of translations) {
      categories.add(t.category);
    }
    return Array.from(categories).sort();
  },
});
