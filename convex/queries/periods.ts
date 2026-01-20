import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("periods").collect();
  },
});

export const getById = query({
  args: { id: v.id("periods") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByAcademicYear = query({
  args: { academicYear: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("periods")
      .withIndex("by_academic_year", (q) => q.eq("academicYear", args.academicYear))
      .collect()
      .then((periods) => periods.sort((a, b) => a.order - b.order));
  },
});

export const getAllWithGrades = query({
  args: { academicYear: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const allPeriods = await ctx.db.query("periods").collect();
    const allLectures = await ctx.db.query("lectures").collect();
    
    // Filter lectures by academic year if provided
    const filteredLectures = args.academicYear
      ? allLectures.filter((l) => l.academicYear === args.academicYear)
      : allLectures;
    
    // Get all sections for grade lookup
    const allSections = await ctx.db.query("sections").collect();
    
    // For each period, find unique grades that use it
    const periodsWithGrades = await Promise.all(
      allPeriods.map(async (period) => {
        // Find lectures that use this period
        const periodLectures = filteredLectures.filter(
          (l) => l.periodId === period._id
        );
        
        const grades = new Set<string>();
        
        for (const lecture of periodLectures) {
          let sectionData: any = null;
          
          if (lecture.sectionId) {
            sectionData = allSections.find((s) => s._id === lecture.sectionId);
          } else if (lecture.classId) {
            // For backward compatibility with classId
            const classData = await ctx.db.get(lecture.classId);
            if (classData) {
              // Find matching sections by grade
              const matchingSections = allSections.filter((s) => {
                const classGradeNorm = classData.grade.trim().toLowerCase();
                const sectionGradeNorm = s.grade.trim().toLowerCase();
                return classGradeNorm === sectionGradeNorm || 
                       classGradeNorm.includes(sectionGradeNorm) ||
                       sectionGradeNorm.includes(classGradeNorm);
              });
              sectionData = matchingSections.length > 0 ? matchingSections[0] : null;
            }
          }
          
          if (sectionData?.grade) {
            grades.add(sectionData.grade);
          }
        }
        
        return {
          ...period,
          grades: Array.from(grades),
        };
      })
    );
    
    return periodsWithGrades;
  },
});