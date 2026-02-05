import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    teacherId: v.id("teachers"),
    dutyTypeId: v.id("dutyTypes"),
    date: v.string(),
    academicYear: v.string(),
    slotLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dutyAssignments", {
      teacherId: args.teacherId,
      dutyTypeId: args.dutyTypeId,
      date: args.date,
      academicYear: args.academicYear,
      slotLabel: args.slotLabel,
    });
  },
});

export const updateAssignment = mutation({
  args: {
    id: v.id("dutyAssignments"),
    teacherId: v.id("teachers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { teacherId: args.teacherId });
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("dutyAssignments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/** Delete all assignments in a date range, then insert new ones (used by generate action). */
export const replaceForDateRange = mutation({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    academicYear: v.string(),
    assignments: v.array(
      v.object({
        teacherId: v.id("teachers"),
        dutyTypeId: v.id("dutyTypes"),
        date: v.string(),
        slotLabel: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dutyAssignments")
      .withIndex("by_date", (q) =>
        q.gte("date", args.startDate).lte("date", args.endDate)
      )
      .collect();
    const toDelete = existing.filter(
      (a) => a.academicYear === args.academicYear
    );
    for (const doc of toDelete) {
      await ctx.db.delete(doc._id);
    }
    const ids = [];
    for (const a of args.assignments) {
      const id = await ctx.db.insert("dutyAssignments", {
        ...a,
        academicYear: args.academicYear,
      });
      ids.push(id);
    }
    return ids;
  },
});
