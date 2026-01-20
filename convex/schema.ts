import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("teacher")),
    passwordHash: v.string(), // Hashed password
  })
    .index("by_email", ["email"]),

  teachers: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    subjects: v.array(v.id("subjects")), // Keep for backward compatibility
    specialty: v.optional(v.string()), // Teacher's specialty/subject area
  })
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"]),

  // Sections represent class sections (e.g., "Section A", "Section B") within a grade
  sections: defineTable({
    name: v.string(), // e.g., "Section A", "Section B"
    grade: v.string(), // e.g., "Grade 1", "Grade 2"
    numberOfStudents: v.number(),
    academicYear: v.string(),
  })
    .index("by_grade", ["grade", "academicYear"])
    .index("by_academic_year", ["academicYear"]),

  // Grade levels (keeping for backward compatibility, but sections are now the primary grouping)
  classes: defineTable({
    name: v.string(),
    grade: v.string(),
    academicYear: v.string(),
  })
    .index("by_academic_year", ["academicYear"]),

  // Individual class sessions - represents a scheduled class with time, date, section, curriculum, and teacher
  classSessions: defineTable({
    sectionId: v.id("sections"),
    curriculumId: v.id("subjects"), // Using subjects as curriculum
    teacherId: v.id("teachers"),
    date: v.string(), // ISO date string (YYYY-MM-DD)
    time: v.string(), // ISO time string (HH:mm)
    endTime: v.optional(v.string()), // ISO time string (HH:mm)
    academicYear: v.string(),
    periodId: v.optional(v.id("periods")), // Optional link to period
    recurring: v.optional(v.boolean()), // Whether this is a recurring class
    dayOfWeek: v.optional(v.number()), // 0-6 for recurring classes
  })
    .index("by_section", ["sectionId", "date"])
    .index("by_teacher", ["teacherId", "date"])
    .index("by_curriculum", ["curriculumId", "date"])
    .index("by_date", ["date"])
    .index("by_academic_year", ["academicYear"])
    .index("by_period", ["periodId", "date"]),

  subjects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
  }),

  units: defineTable({
    subjectId: v.id("subjects"),
    name: v.string(),
    order: v.number(),
    description: v.optional(v.string()),
  })
    .index("by_subject", ["subjectId", "order"]),

  lessons: defineTable({
    unitId: v.id("units"),
    name: v.string(),
    order: v.number(),
    duration: v.number(), // in minutes
    prerequisites: v.array(v.id("lessons")),
  })
    .index("by_unit", ["unitId", "order"])
    .index("by_prerequisites", ["prerequisites"]),

  lectures: defineTable({
    teacherId: v.id("teachers"),
    sectionId: v.optional(v.id("sections")), // Optional for backward compatibility - will be required after migration
    classId: v.optional(v.id("classes")), // Kept for backward compatibility with existing data
    lessonId: v.id("lessons"),
    startTime: v.string(), // ISO time string (HH:mm)
    endTime: v.string(), // ISO time string (HH:mm)
    dayOfWeek: v.number(), // 0-6 (Sunday-Saturday)
    recurring: v.boolean(),
    date: v.optional(v.string()), // ISO date string for one-time lectures
    academicYear: v.string(),
    periodId: v.optional(v.id("periods")), // Direct relation to period
  })
    .index("by_teacher", ["teacherId", "dayOfWeek", "startTime"])
    // Note: by_section index removed because sectionId is optional - queries will filter manually
    .index("by_lesson", ["lessonId"])
    .index("by_academic_year", ["academicYear"])
    .index("by_date", ["date"])
    .index("by_period", ["periodId", "dayOfWeek"]),

  periods: defineTable({
    name: v.string(), // "First", "Second", etc.
    nameAr: v.optional(v.string()), // "الاولى", "الثانية", etc.
    startTime: v.string(), // "08:10"
    endTime: v.string(), // "08:50"
    isBreak: v.boolean(), // true for break periods
    order: v.number(), // Display order
    academicYear: v.string(), // Link to academic year
  })
    .index("by_academic_year", ["academicYear", "order"]),
});
