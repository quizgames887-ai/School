import { query } from "../_generated/server";
import { v } from "convex/values";

// Helper to format date as ISO string (YYYY-MM-DD)
function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Check if there are lectures without corresponding class sessions for the current week
export const getUnsyncedLecturesCount = query({
  args: {
    academicYear: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current week's start and end dates
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek); // Start of week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
    
    // Get all recurring lectures for the academic year
    const lectures = await ctx.db
      .query("lectures")
      .withIndex("by_academic_year", (q) => q.eq("academicYear", args.academicYear))
      .collect();
    
    const recurringLectures = lectures.filter((l) => l.recurring && l.sectionId);
    
    if (recurringLectures.length === 0) {
      return { unsyncedCount: 0, totalLectures: 0, nextSyncDate: null };
    }
    
    // Get class sessions for this week
    const sessions = await ctx.db
      .query("classSessions")
      .withIndex("by_academic_year", (q) => q.eq("academicYear", args.academicYear))
      .collect();
    
    const sessionsThisWeek = sessions.filter((s) => {
      const sessionDate = new Date(s.date);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });
    
    // Create a set of existing session keys
    const existingKeys = new Set<string>();
    sessionsThisWeek.forEach((s) => {
      const key = `${s.teacherId}_${s.sectionId}_${s.date}_${s.time}`;
      existingKeys.set(key);
    });
    
    // Count lectures without corresponding sessions this week
    let unsyncedCount = 0;
    let nextSyncDate: string | null = null;
    
    for (const lecture of recurringLectures) {
      // Find the date for this lecture's day of week this week
      const lectureDate = new Date(weekStart);
      lectureDate.setDate(weekStart.getDate() + lecture.dayOfWeek);
      
      // Only count if the lecture date is today or in the future
      if (lectureDate >= today) {
        const dateStr = formatDateISO(lectureDate);
        const key = `${lecture.teacherId}_${lecture.sectionId}_${dateStr}_${lecture.startTime}`;
        
        if (!existingKeys.has(key)) {
          unsyncedCount++;
          if (!nextSyncDate || dateStr < nextSyncDate) {
            nextSyncDate = dateStr;
          }
        }
      }
    }
    
    return {
      unsyncedCount,
      totalLectures: recurringLectures.length,
      nextSyncDate,
    };
  },
});

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
