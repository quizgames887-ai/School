import { query } from "../_generated/server";
import { v } from "convex/values";

// Helper function to normalize and match grades (handles English/Arabic variations)
function normalizeGrade(grade: string): string {
  return grade.trim().toLowerCase();
}

function gradesMatch(classGrade: string, sectionGrade: string): boolean {
  const classGradeNorm = normalizeGrade(classGrade);
  const sectionGradeNorm = normalizeGrade(sectionGrade);
  
  // Try exact match first
  if (classGradeNorm === sectionGradeNorm) return true;
  
  // Map common English grades to Arabic equivalents
  const gradeMap: Record<string, string[]> = {
    "grade 1": ["الصف الاول", "الصف الأول", "grade 1", "الصف الاول "],
    "grade 2": ["الصف الثاني", "الصف الثاني", "grade 2"],
    "grade 3": ["الصف الثالث", "الصف الثالث", "grade 3"],
    "grade 4": ["الصف الرابع", "الصف الرابع", "grade 4"],
    "grade 5": ["الصف الخامس", "الصف الخامس", "grade 5"],
    "grade 6": ["الصف السادس", "الصف السادس", "grade 6"],
  };
  
  // Check if class grade matches any variant in the map
  for (const [key, variants] of Object.entries(gradeMap)) {
    const classMatches = classGradeNorm.includes(key) || 
                        variants.some(v => classGradeNorm.includes(normalizeGrade(v)));
    const sectionMatches = sectionGradeNorm.includes(key) || 
                          variants.some(v => sectionGradeNorm.includes(normalizeGrade(v)));
    
    if (classMatches && sectionMatches) return true;
  }
  
  return false;
}

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("lectures").collect();
  },
});

export const getById = query({
  args: { id: v.id("lectures") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByTeacher = query({
  args: { teacherId: v.id("teachers") },
  handler: async (ctx, args) => {
    const lectures = await ctx.db
      .query("lectures")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();
    return lectures;
  },
});

export const getBySection = query({
  args: { sectionId: v.id("sections") },
  handler: async (ctx, args) => {
    // Query all lectures and filter by sectionId (handles optional sectionId in schema)
    const allLectures = await ctx.db.query("lectures").collect();
    return allLectures.filter((lecture) => lecture.sectionId === args.sectionId);
  },
});

export const getByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lectures = args.academicYear
      ? await ctx.db
          .query("lectures")
          .withIndex("by_academic_year", (q) => {
            const academicYear = args.academicYear!;
            return q.eq("academicYear", academicYear);
          })
          .collect()
      : await ctx.db.query("lectures").collect();
    
    // Filter by date range for one-time lectures
    const start = new Date(args.startDate);
    const end = new Date(args.endDate);
    
    return lectures.filter((lecture) => {
      if (lecture.recurring) {
        return true; // Include all recurring lectures
      }
      if (lecture.date) {
        const lectureDate = new Date(lecture.date);
        return lectureDate >= start && lectureDate <= end;
      }
      return false;
    });
  },
});

export const getByDayOfWeek = query({
  args: {
    dayOfWeek: v.number(),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allLectures = await ctx.db.query("lectures").collect();
    
    return allLectures.filter((lecture) => {
      if (args.academicYear && lecture.academicYear !== args.academicYear) {
        return false;
      }
      return lecture.dayOfWeek === args.dayOfWeek;
    });
  },
});

export const getByTeacherWithDetails = query({
  args: { teacherId: v.id("teachers"), academicYear: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("lectures")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId));
    
    const lectures = await query.collect();
    
    // Filter by academic year if provided
    const filteredLectures = args.academicYear
      ? lectures.filter((l) => l.academicYear === args.academicYear)
      : lectures;
    
    // Enrich lectures with subject and class data
    const enrichedLectures = await Promise.all(
      filteredLectures.map(async (lecture) => {
        const lesson = await ctx.db.get(lecture.lessonId);
        if (!lesson) {
          return { ...lecture, subjectName: "Unknown", sectionName: "Unknown", sectionGrade: "Unknown", sectionNumberOfStudents: undefined, className: "Unknown" };
        }
        
        const unit = await ctx.db.get(lesson.unitId);
        if (!unit) {
          return { ...lecture, subjectName: "Unknown", sectionName: "Unknown", sectionGrade: "Unknown", sectionNumberOfStudents: undefined, className: "Unknown" };
        }
        
        const subject = await ctx.db.get(unit.subjectId);
        // Handle backward compatibility: use sectionId if available, otherwise fall back to classId
        let sectionData: any = null;
        
        if (lecture.sectionId) {
          sectionData = await ctx.db.get(lecture.sectionId);
        } else if (lecture.classId) {
          const classData = await ctx.db.get(lecture.classId);
          
          if (classData) {
            const sections = await ctx.db
              .query("sections")
              .withIndex("by_academic_year", (q) => q.eq("academicYear", lecture.academicYear))
              .collect();
            
            // Find sections matching the class grade - handle both English and Arabic grade names
            const matchingSections = sections.filter((s) => {
              return gradesMatch(classData.grade, s.grade);
            });
            
            // Use the first matching section (the section name like "Section A" is what we want to display)
            sectionData = matchingSections.length > 0 ? matchingSections[0] : null;
          }
        }
        
        const sectionName = sectionData?.name || "Unknown";
        
        return {
          ...lecture,
          subjectName: subject?.name || "Unknown",
          sectionName: sectionName,
          sectionGrade: sectionData?.grade || "Unknown",
          sectionNumberOfStudents: sectionData?.numberOfStudents,
          lessonName: lesson.name,
          // Keep className for backward compatibility with components that still use it
          className: sectionName,
        };
      })
    );
    
    return enrichedLectures;
  },
});

export const getLecturesByPeriod = query({
  args: {
    periodId: v.id("periods"),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = await ctx.db.get(args.periodId);
    if (!period) {
      return [];
    }
    
    // First try to get lectures by periodId (direct relation)
    let lectures = await ctx.db
      .query("lectures")
      .withIndex("by_period", (q) => q.eq("periodId", args.periodId))
      .collect();
    
    // Filter by academic year if provided
    if (args.academicYear) {
      lectures = lectures.filter((l) => l.academicYear === args.academicYear);
    }
    
    // If no lectures found by periodId, fallback to time-based matching
    if (lectures.length === 0) {
      const allLectures = args.academicYear
        ? await ctx.db
            .query("lectures")
            .withIndex("by_academic_year", (q) => {
              const academicYear = args.academicYear!;
              return q.eq("academicYear", academicYear);
            })
            .collect()
        : await ctx.db.query("lectures").collect();
      
      // Filter lectures that overlap with the period time range
      const periodStart = period.startTime.split(":").map(Number);
      const periodEnd = period.endTime.split(":").map(Number);
      const periodStartMinutes = periodStart[0] * 60 + periodStart[1];
      const periodEndMinutes = periodEnd[0] * 60 + periodEnd[1];
      
      lectures = allLectures.filter((lecture) => {
        const lectureStart = lecture.startTime.split(":").map(Number);
        const lectureEnd = lecture.endTime.split(":").map(Number);
        const lectureStartMinutes = lectureStart[0] * 60 + lectureStart[1];
        const lectureEndMinutes = lectureEnd[0] * 60 + lectureEnd[1];
        
        // Check if lecture overlaps with period
        return (
          (lectureStartMinutes < periodEndMinutes && lectureEndMinutes > periodStartMinutes)
        );
      });
    }
    
    // Enrich with subject and class data
    const enrichedLectures = await Promise.all(
      lectures.map(async (lecture) => {
        const lesson = await ctx.db.get(lecture.lessonId);
        if (!lesson) {
          return { ...lecture, subjectName: "Unknown", sectionName: "Unknown", sectionGrade: "Unknown", className: "Unknown", lessonName: "Unknown" };
        }
        
        const unit = await ctx.db.get(lesson.unitId);
        if (!unit) {
          return { ...lecture, subjectName: "Unknown", sectionName: "Unknown", sectionGrade: "Unknown", className: "Unknown", lessonName: lesson.name };
        }
        
        const subject = await ctx.db.get(unit.subjectId);
        // Handle backward compatibility: use sectionId if available, otherwise fall back to classId
        let sectionData: any = null;
        if (lecture.sectionId) {
          sectionData = await ctx.db.get(lecture.sectionId);
        } else if (lecture.classId) {
          const classData = await ctx.db.get(lecture.classId);
          if (classData) {
            const sections = await ctx.db
              .query("sections")
              .withIndex("by_academic_year", (q) => q.eq("academicYear", lecture.academicYear))
              .collect();
            const matchingSections = sections.filter((s) => gradesMatch(classData.grade, s.grade));
            sectionData = matchingSections.length > 0 ? matchingSections[0] : null;
          }
        }
        
        const sectionName = sectionData?.name || "Unknown";
        
        return {
          ...lecture,
          subjectName: subject?.name || "Unknown",
          sectionName: sectionName,
          sectionGrade: sectionData?.grade || "Unknown",
          sectionNumberOfStudents: sectionData?.numberOfStudents,
          lessonName: lesson.name,
          // Keep className for backward compatibility
          className: sectionName,
        };
      })
    );
    
    return enrichedLectures;
  },
});

export const getByTeacherAndPeriod = query({
  args: {
    teacherId: v.id("teachers"),
    periodId: v.id("periods"),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try to get lectures by periodId first (direct relation)
    let lectures = await ctx.db
      .query("lectures")
      .withIndex("by_period", (q) => q.eq("periodId", args.periodId))
      .collect();
    
    // Filter by teacher
    lectures = lectures.filter((l) => l.teacherId === args.teacherId);
    
    // Filter by academic year if provided
    if (args.academicYear) {
      lectures = lectures.filter((l) => l.academicYear === args.academicYear);
    }
    
    // If no lectures found by periodId, fallback to time-based matching
    if (lectures.length === 0) {
      const period = await ctx.db.get(args.periodId);
      if (!period) {
        return [];
      }
      
      const teacherLectures = await ctx.db
        .query("lectures")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
        .collect();
      
      // Filter by academic year if provided
      const filteredLectures = args.academicYear
        ? teacherLectures.filter((l) => l.academicYear === args.academicYear)
        : teacherLectures;
      
      // Match by time overlap
      const periodStart = period.startTime.split(":").map(Number);
      const periodEnd = period.endTime.split(":").map(Number);
      const periodStartMinutes = periodStart[0] * 60 + periodStart[1];
      const periodEndMinutes = periodEnd[0] * 60 + periodEnd[1];
      
      lectures = filteredLectures.filter((lecture) => {
        const lectureStart = lecture.startTime.split(":").map(Number);
        const lectureEnd = lecture.endTime.split(":").map(Number);
        const lectureStartMinutes = lectureStart[0] * 60 + lectureStart[1];
        const lectureEndMinutes = lectureEnd[0] * 60 + lectureEnd[1];
        
        return (
          lectureStartMinutes < periodEndMinutes && lectureEndMinutes > periodStartMinutes
        );
      });
    }
    
    // Enrich with curriculum details
    const enrichedLectures = await Promise.all(
      lectures.map(async (lecture) => {
        const lesson = await ctx.db.get(lecture.lessonId);
        if (!lesson) {
          return { ...lecture, subjectName: "Unknown", sectionName: "Unknown", sectionGrade: "Unknown", className: "Unknown", lessonName: "Unknown" };
        }
        
        const unit = await ctx.db.get(lesson.unitId);
        if (!unit) {
          return { ...lecture, subjectName: "Unknown", sectionName: "Unknown", sectionGrade: "Unknown", className: "Unknown", lessonName: lesson.name };
        }
        
        const subject = await ctx.db.get(unit.subjectId);
        // Handle backward compatibility: use sectionId if available, otherwise fall back to classId
        let sectionData: any = null;
        if (lecture.sectionId) {
          sectionData = await ctx.db.get(lecture.sectionId);
        } else if (lecture.classId) {
          const classData = await ctx.db.get(lecture.classId);
          if (classData) {
            const sections = await ctx.db
              .query("sections")
              .withIndex("by_academic_year", (q) => q.eq("academicYear", lecture.academicYear))
              .collect();
            const matchingSections = sections.filter((s) => gradesMatch(classData.grade, s.grade));
            sectionData = matchingSections.length > 0 ? matchingSections[0] : null;
          }
        }
        
        const sectionName = sectionData?.name || "Unknown";
        
        return {
          ...lecture,
          subjectName: subject?.name || "Unknown",
          sectionName: sectionName,
          sectionGrade: sectionData?.grade || "Unknown",
          sectionNumberOfStudents: sectionData?.numberOfStudents,
          lessonName: lesson.name,
          // Keep className for backward compatibility
          className: sectionName,
        };
      })
    );
    
    return enrichedLectures;
  },
});

export const getTeacherScheduleByPeriods = query({
  args: {
    teacherId: v.id("teachers"),
    academicYear: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all periods for the academic year
    const periods = await ctx.db
      .query("periods")
      .withIndex("by_academic_year", (q) => q.eq("academicYear", args.academicYear))
      .collect();
    
    const sortedPeriods = periods.sort((a, b) => a.order - b.order);
    
    // Get all lectures for the teacher in this academic year
    const allLectures = await ctx.db
      .query("lectures")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();
    
    const filteredLectures = allLectures.filter(
      (l) => l.academicYear === args.academicYear && l.recurring
    );
    
    // Organize lectures by period and day
    const scheduleByPeriod: Record<string, Record<number, any[]>> = {};
    
    // Initialize structure
    sortedPeriods.forEach((period) => {
      if (!period.isBreak) {
        scheduleByPeriod[period._id] = {};
        for (let day = 0; day < 7; day++) {
          scheduleByPeriod[period._id][day] = [];
        }
      }
    });
    
    // Enrich and organize lectures
    await Promise.all(
      filteredLectures.map(async (lecture) => {
        const lesson = await ctx.db.get(lecture.lessonId);
        if (!lesson) return;
        
        const unit = await ctx.db.get(lesson.unitId);
        if (!unit) return;
        
        const subject = await ctx.db.get(unit.subjectId);
        // Handle backward compatibility: use sectionId if available
        let sectionData: any = null;
        if (lecture.sectionId) {
          sectionData = await ctx.db.get(lecture.sectionId);
        } else if (lecture.classId) {
          // For old data with classId, try to find matching section
          const classData = await ctx.db.get(lecture.classId);
          if (classData) {
            const sections = await ctx.db
              .query("sections")
              .withIndex("by_academic_year", (q) => q.eq("academicYear", lecture.academicYear))
              .collect();
            const matchingSections = sections.filter((s) => gradesMatch(classData.grade, s.grade));
            sectionData = matchingSections.length > 0 ? matchingSections[0] : null;
          }
        }
        
        const sectionName = sectionData?.name || "Unknown";
        
        const enrichedLecture = {
          ...lecture,
          subjectName: subject?.name || "Unknown",
          sectionName: sectionName,
          sectionGrade: sectionData?.grade || "Unknown",
          sectionNumberOfStudents: sectionData?.numberOfStudents,
          lessonName: lesson.name,
          // Keep className for backward compatibility
          className: sectionName,
        };
        
        // If lecture has periodId, use it directly
        if (lecture.periodId && scheduleByPeriod[lecture.periodId]) {
          const day = lecture.dayOfWeek;
          if (day >= 0 && day <= 6) {
            scheduleByPeriod[lecture.periodId][day].push(enrichedLecture);
          }
        } else {
          // Fallback to time-based matching
          const lectureStart = lecture.startTime.split(":").map(Number);
          const lectureEnd = lecture.endTime.split(":").map(Number);
          const lectureStartMinutes = lectureStart[0] * 60 + lectureStart[1];
          const lectureEndMinutes = lectureEnd[0] * 60 + lectureEnd[1];
          
          sortedPeriods.forEach((period) => {
            if (period.isBreak) return;
            
            const periodStart = period.startTime.split(":").map(Number);
            const periodEnd = period.endTime.split(":").map(Number);
            const periodStartMinutes = periodStart[0] * 60 + periodStart[1];
            const periodEndMinutes = periodEnd[0] * 60 + periodEnd[1];
            
            if (
              lectureStartMinutes < periodEndMinutes &&
              lectureEndMinutes > periodStartMinutes
            ) {
              const day = lecture.dayOfWeek;
              if (day >= 0 && day <= 6 && scheduleByPeriod[period._id]) {
                scheduleByPeriod[period._id][day].push(enrichedLecture);
              }
            }
          });
        }
      })
    );
    
    return {
      periods: sortedPeriods,
      schedule: scheduleByPeriod,
    };
  },
});