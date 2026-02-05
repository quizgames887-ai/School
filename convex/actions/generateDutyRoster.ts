"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

const DEFAULT_MAX_DUTIES_PER_WEEK = 3;
const DEFAULT_MAX_DUTIES_PER_DAY = 1;

export const generateDutyRoster = action({
  args: {
    academicYear: v.string(),
    weekStartDate: v.string(), // YYYY-MM-DD (e.g. Sunday)
  },
  handler: async (ctx, args) => {
    const [config, dutyTypes, profiles, loadMap, teachers] = await Promise.all([
      ctx.runQuery(api.queries.dutyConfig.getByAcademicYear, {
        academicYear: args.academicYear,
      }),
      ctx.runQuery(api.queries.dutyTypes.getByAcademicYear, {
        academicYear: args.academicYear,
      }),
      ctx.runQuery(api.queries.teacherDutyProfiles.getByAcademicYear, {
        academicYear: args.academicYear,
      }),
      ctx.runQuery(api.queries.teachingLoad.getLecturesPerWeekByTeacher, {
        academicYear: args.academicYear,
      }),
      ctx.runQuery(api.queries.teachers.getAll, {}),
    ]);

    if (!config || !dutyTypes.length || !teachers.length) {
      throw new Error(
        "Missing duty config, duty types, or teachers. Configure working days and duty types first."
      );
    }

    const workingDays = config.workingDays;
    const start = new Date(args.weekStartDate);
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      weekDates.push(d.toISOString().slice(0, 10));
    }

    const profileByTeacher = new Map<string, (typeof profiles)[0]>();
    for (const p of profiles) {
      profileByTeacher.set(p.teacherId, p);
    }

    function getTeachingLoad(teacherId: string): number {
      const profile = profileByTeacher.get(teacherId);
      if (profile?.teachingLoadOverride !== undefined)
        return profile.teachingLoadOverride;
      return (loadMap as Record<string, number>)[teacherId] ?? 0;
    }

    function isAvailable(teacherId: string, dayOfWeek: number): boolean {
      const profile = profileByTeacher.get(teacherId);
      const availableDays = profile?.availableDays ?? [];
      if (availableDays.length === 0) return workingDays.includes(dayOfWeek);
      return availableDays.includes(dayOfWeek);
    }

    function isExcluded(teacherId: string, dayOfWeek: number, dutyTypeId: Id<"dutyTypes">): boolean {
      const profile = profileByTeacher.get(teacherId);
      if (profile?.excludeDays?.includes(dayOfWeek)) return true;
      if (profile?.excludeDutyTypeIds?.includes(dutyTypeId)) return true;
      return false;
    }

    function getMaxDutiesPerWeek(teacherId: string): number {
      const profile = profileByTeacher.get(teacherId);
      return profile?.maxDutiesPerWeek ?? DEFAULT_MAX_DUTIES_PER_WEEK;
    }

    function getMaxDutiesPerDay(teacherId: string): number {
      const profile = profileByTeacher.get(teacherId);
      return profile?.maxDutiesPerDay ?? DEFAULT_MAX_DUTIES_PER_DAY;
    }

    const assignments: {
      teacherId: Id<"teachers">;
      dutyTypeId: Id<"dutyTypes">;
      date: string;
      slotLabel?: string;
    }[] = [];

    const dutiesPerTeacherWeek = new Map<string, number>();
    const dutiesPerTeacherDay = new Map<string, number>();
    const lastDutyTypeByTeacher = new Map<string, Id<"dutyTypes"> | null>();

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dateStr = weekDates[dayIndex];
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();

      if (!workingDays.includes(dayOfWeek)) continue;

      for (const dutyType of dutyTypes) {
        const n = dutyType.requiredTeachers;
        const candidates = teachers
          .filter((t: { _id: Id<"teachers"> }) => {
            if (!isAvailable(t._id, dayOfWeek)) return false;
            if (isExcluded(t._id, dayOfWeek, dutyType._id)) return false;
            const weekCount = dutiesPerTeacherWeek.get(t._id) ?? 0;
            const dayCount = dutiesPerTeacherDay.get(`${t._id}-${dateStr}`) ?? 0;
            if (weekCount >= getMaxDutiesPerWeek(t._id)) return false;
            if (dayCount >= getMaxDutiesPerDay(t._id)) return false;
            return true;
          })
          .sort((a: { _id: Id<"teachers"> }, b: { _id: Id<"teachers"> }) => {
            const loadA = getTeachingLoad(a._id);
            const loadB = getTeachingLoad(b._id);
            if (loadA !== loadB) return loadA - loadB;
            const weekA = dutiesPerTeacherWeek.get(a._id) ?? 0;
            const weekB = dutiesPerTeacherWeek.get(b._id) ?? 0;
            if (weekA !== weekB) return weekA - weekB;
            const lastA = lastDutyTypeByTeacher.get(a._id);
            const lastB = lastDutyTypeByTeacher.get(b._id);
            const penaltyA = lastA === dutyType._id ? 1 : 0;
            const penaltyB = lastB === dutyType._id ? 1 : 0;
            return penaltyA - penaltyB;
          });

        for (let i = 0; i < n && i < candidates.length; i++) {
          const t = candidates[i] as { _id: Id<"teachers"> };
          assignments.push({
            teacherId: t._id,
            dutyTypeId: dutyType._id,
            date: dateStr,
          });
          dutiesPerTeacherWeek.set(t._id, (dutiesPerTeacherWeek.get(t._id) ?? 0) + 1);
          dutiesPerTeacherDay.set(
            `${t._id}-${dateStr}`,
            (dutiesPerTeacherDay.get(`${t._id}-${dateStr}`) ?? 0) + 1
          );
          lastDutyTypeByTeacher.set(t._id, dutyType._id);
        }
      }
    }

    const endDate = weekDates[6];
    await ctx.runMutation(api.mutations.dutyAssignments.replaceForDateRange, {
      startDate: args.weekStartDate,
      endDate,
      academicYear: args.academicYear,
      assignments,
    });

    return { count: assignments.length, startDate: args.weekStartDate, endDate };
  },
});
