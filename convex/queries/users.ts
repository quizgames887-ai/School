import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    // Enrich users with their teacher profiles and photo URLs
    const usersWithTeachers = await Promise.all(
      users.map(async (user) => {
        const teacher = await ctx.db
          .query("teachers")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .first();
        
        // Get photo URL if photoId exists
        const photoUrl = user.photoId 
          ? await ctx.storage.getUrl(user.photoId) 
          : null;
        
        return {
          ...user,
          photoUrl,
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
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!user) return null;
    
    // Get photo URL if photoId exists
    const photoUrl = user.photoId 
      ? await ctx.storage.getUrl(user.photoId) 
      : null;
    
    return {
      ...user,
      photoUrl,
    };
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
    
    // Get photo URL if photoId exists
    const photoUrl = user.photoId 
      ? await ctx.storage.getUrl(user.photoId) 
      : null;
    
    return {
      ...user,
      photoUrl,
      teacherProfile: teacher || null,
    };
  },
});

export const getAllWithGrades = query({
  args: { academicYear: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const allLectures = await ctx.db.query("lectures").collect();
    
    // Filter lectures by academic year if provided
    const filteredLectures = args.academicYear
      ? allLectures.filter((l) => l.academicYear === args.academicYear)
      : allLectures;
    
    // Get all sections for grade lookup
    const allSections = await ctx.db.query("sections").collect();
    
    // Enrich users with teacher profiles and grades
    const usersWithGrades = await Promise.all(
      users.map(async (user) => {
        const teacher = await ctx.db
          .query("teachers")
          .withIndex("by_user_id", (q) => q.eq("userId", user._id))
          .first();
        
        let grades: string[] = [];
        
        // Get photo URL if photoId exists
        const photoUrl = user.photoId 
          ? await ctx.storage.getUrl(user.photoId) 
          : null;
        
        // If user is admin, return with empty grades
        if (user.role === "admin") {
          return {
            ...user,
            photoUrl,
            teacherProfile: teacher || null,
            grades: [],
          };
        }
        
        // For teachers, find grades from their lectures
        if (teacher) {
          const teacherLectures = filteredLectures.filter(
            (l) => l.teacherId === teacher._id
          );
          
          const gradeSet = new Set<string>();
          
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
              gradeSet.add(sectionData.grade);
            }
          }
          
          grades = Array.from(gradeSet);
        }
        
        return {
          ...user,
          photoUrl,
          teacherProfile: teacher || null,
          grades,
        };
      })
    );
    
    return usersWithGrades;
  },
});