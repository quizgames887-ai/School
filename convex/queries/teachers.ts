import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teachers").collect();
  },
});

export const getById = query({
  args: { id: v.id("teachers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teachers")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teachers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getAllWithGrades = query({
  args: { academicYear: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const teachers = await ctx.db.query("teachers").collect();
    const allLectures = await ctx.db.query("lectures").collect();
    
    // Filter lectures by academic year if provided
    const filteredLectures = args.academicYear
      ? allLectures.filter((l) => l.academicYear === args.academicYear)
      : allLectures;
    
    // Get all sections for grade lookup
    const allSections = await ctx.db.query("sections").collect();
    
    // For each teacher, find unique grades they teach
    const teachersWithGrades = await Promise.all(
      teachers.map(async (teacher) => {
        const teacherLectures = filteredLectures.filter(
          (l) => l.teacherId === teacher._id
        );
        
        const grades = new Set<string>();
        
        for (const lecture of teacherLectures) {
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
          ...teacher,
          grades: Array.from(grades),
        };
      })
    );
    
    return teachersWithGrades;
  },
});