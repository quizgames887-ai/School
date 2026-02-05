/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_validateSchedule from "../actions/validateSchedule.js";
import type * as mutations_classSessions from "../mutations/classSessions.js";
import type * as mutations_classes from "../mutations/classes.js";
import type * as mutations_lectures from "../mutations/lectures.js";
import type * as mutations_lessons from "../mutations/lessons.js";
import type * as mutations_periods from "../mutations/periods.js";
import type * as mutations_sections from "../mutations/sections.js";
import type * as mutations_seed from "../mutations/seed.js";
import type * as mutations_subjects from "../mutations/subjects.js";
import type * as mutations_teachers from "../mutations/teachers.js";
import type * as mutations_translations from "../mutations/translations.js";
import type * as mutations_units from "../mutations/units.js";
import type * as mutations_users from "../mutations/users.js";
import type * as queries_classSessions from "../queries/classSessions.js";
import type * as queries_classes from "../queries/classes.js";
import type * as queries_conflicts from "../queries/conflicts.js";
import type * as queries_curriculum from "../queries/curriculum.js";
import type * as queries_lectures from "../queries/lectures.js";
import type * as queries_lessons from "../queries/lessons.js";
import type * as queries_periods from "../queries/periods.js";
import type * as queries_sections from "../queries/sections.js";
import type * as queries_subjects from "../queries/subjects.js";
import type * as queries_teachers from "../queries/teachers.js";
import type * as queries_translations from "../queries/translations.js";
import type * as queries_users from "../queries/users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/validateSchedule": typeof actions_validateSchedule;
  "mutations/classSessions": typeof mutations_classSessions;
  "mutations/classes": typeof mutations_classes;
  "mutations/lectures": typeof mutations_lectures;
  "mutations/lessons": typeof mutations_lessons;
  "mutations/periods": typeof mutations_periods;
  "mutations/sections": typeof mutations_sections;
  "mutations/seed": typeof mutations_seed;
  "mutations/subjects": typeof mutations_subjects;
  "mutations/teachers": typeof mutations_teachers;
  "mutations/translations": typeof mutations_translations;
  "mutations/units": typeof mutations_units;
  "mutations/users": typeof mutations_users;
  "queries/classSessions": typeof queries_classSessions;
  "queries/classes": typeof queries_classes;
  "queries/conflicts": typeof queries_conflicts;
  "queries/curriculum": typeof queries_curriculum;
  "queries/lectures": typeof queries_lectures;
  "queries/lessons": typeof queries_lessons;
  "queries/periods": typeof queries_periods;
  "queries/sections": typeof queries_sections;
  "queries/subjects": typeof queries_subjects;
  "queries/teachers": typeof queries_teachers;
  "queries/translations": typeof queries_translations;
  "queries/users": typeof queries_users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
