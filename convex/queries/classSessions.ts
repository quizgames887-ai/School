import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("classSessions").collect();
    
    // Enrich with related data
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const section = await ctx.db.get(session.sectionId);
        const curriculum = await ctx.db.get(session.curriculumId);
        const teacher = await ctx.db.get(session.teacherId);
        const period = session.periodId ? await ctx.db.get(session.periodId) : null;
        
        return {
          ...session,
          sectionName: section?.name || "Unknown",
          sectionGrade: section?.grade || "Unknown",
          curriculumName: curriculum?.name || "Unknown",
          teacherName: teacher?.name || "Unknown",
          periodName: period?.name || null,
        };
      })
    );
    
    return enrichedSessions;
  },
});

export const getById = query({
  args: { id: v.id("classSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) return null;
    
    // Enrich with related data
    const section = await ctx.db.get(session.sectionId);
    const curriculum = await ctx.db.get(session.curriculumId);
    const teacher = await ctx.db.get(session.teacherId);
    const period = session.periodId ? await ctx.db.get(session.periodId) : null;
    
    return {
      ...session,
      sectionName: section?.name || "Unknown",
      sectionGrade: section?.grade || "Unknown",
      curriculumName: curriculum?.name || "Unknown",
      teacherName: teacher?.name || "Unknown",
      periodName: period?.name || null,
    };
  },
});

export const getBySection = query({
  args: {
    sectionId: v.id("sections"),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("classSessions")
      .withIndex("by_section", (q) => q.eq("sectionId", args.sectionId));
    
    const sessions = await query.collect();
    
    if (args.date) {
      return sessions.filter((s) => s.date === args.date);
    }
    
    // Enrich with related data
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const section = await ctx.db.get(session.sectionId);
        const curriculum = await ctx.db.get(session.curriculumId);
        const teacher = await ctx.db.get(session.teacherId);
        const period = session.periodId ? await ctx.db.get(session.periodId) : null;
        
        return {
          ...session,
          sectionName: section?.name || "Unknown",
          sectionGrade: section?.grade || "Unknown",
          curriculumName: curriculum?.name || "Unknown",
          teacherName: teacher?.name || "Unknown",
          periodName: period?.name || null,
        };
      })
    );
    
    return enrichedSessions;
  },
});

export const getByTeacher = query({
  args: {
    teacherId: v.id("teachers"),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("classSessions")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId));
    
    const sessions = await query.collect();
    
    if (args.date) {
      return sessions.filter((s) => s.date === args.date);
    }
    
    // Enrich with related data
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const section = await ctx.db.get(session.sectionId);
        const curriculum = await ctx.db.get(session.curriculumId);
        const teacher = await ctx.db.get(session.teacherId);
        const period = session.periodId ? await ctx.db.get(session.periodId) : null;
        
        return {
          ...session,
          sectionName: section?.name || "Unknown",
          sectionGrade: section?.grade || "Unknown",
          curriculumName: curriculum?.name || "Unknown",
          teacherName: teacher?.name || "Unknown",
          periodName: period?.name || null,
        };
      })
    );
    
    return enrichedSessions;
  },
});

export const getByCurriculum = query({
  args: {
    curriculumId: v.id("subjects"),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("classSessions")
      .withIndex("by_curriculum", (q) => q.eq("curriculumId", args.curriculumId));
    
    const sessions = await query.collect();
    
    if (args.date) {
      return sessions.filter((s) => s.date === args.date);
    }
    
    // Enrich with related data
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const section = await ctx.db.get(session.sectionId);
        const curriculum = await ctx.db.get(session.curriculumId);
        const teacher = await ctx.db.get(session.teacherId);
        const period = session.periodId ? await ctx.db.get(session.periodId) : null;
        
        return {
          ...session,
          sectionName: section?.name || "Unknown",
          sectionGrade: section?.grade || "Unknown",
          curriculumName: curriculum?.name || "Unknown",
          teacherName: teacher?.name || "Unknown",
          periodName: period?.name || null,
        };
      })
    );
    
    return enrichedSessions;
  },
});

export const getByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allSessions = await ctx.db.query("classSessions").collect();
    
    const start = new Date(args.startDate);
    const end = new Date(args.endDate);
    
    const filteredSessions = allSessions.filter((session) => {
      if (args.academicYear && session.academicYear !== args.academicYear) {
        return false;
      }
      const sessionDate = new Date(session.date);
      return sessionDate >= start && sessionDate <= end;
    });
    
    // Enrich with related data
    const enrichedSessions = await Promise.all(
      filteredSessions.map(async (session) => {
        const section = await ctx.db.get(session.sectionId);
        const curriculum = await ctx.db.get(session.curriculumId);
        const teacher = await ctx.db.get(session.teacherId);
        const period = session.periodId ? await ctx.db.get(session.periodId) : null;
        
        return {
          ...session,
          sectionName: section?.name || "Unknown",
          sectionGrade: section?.grade || "Unknown",
          curriculumName: curriculum?.name || "Unknown",
          teacherName: teacher?.name || "Unknown",
          periodName: period?.name || null,
        };
      })
    );
    
    return enrichedSessions;
  },
});
