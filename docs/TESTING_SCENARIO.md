# Full Testing Scenario — School Schedule Management System

This document describes end-to-end and feature-level test scenarios for the School Schedule application (Next.js + Convex).

---

## 1. Pre-requisites & Environment

| Item | Requirement |
|------|-------------|
| **App URL** | `http://localhost:3002` (or configured dev port) |
| **Convex** | `npx convex dev` running; `NEXT_PUBLIC_CONVEX_URL` in `.env.local` |
| **Database** | Convex backend connected; optional: seed periods via Admin → Periods → "Seed Default" |
| **Test accounts** | At least: 1 Admin, 1 Teacher (with linked teacher profile) |

---

## 2. Authentication

### 2.1 Login — Happy path

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/login` | Login form: email, password, "Sign in", link to Sign up |
| 2 | Enter valid admin email + password | No error; redirect to `/admin/dashboard` |
| 3 | Enter valid teacher email + password | No error; redirect to `/admin/dashboard` |

### 2.2 Login — Validation & errors

| Step | Action | Expected |
|------|--------|----------|
| 1 | Submit with empty email/password | Browser required-field validation or "Sign in" disabled |
| 2 | Submit with wrong password | Error message (e.g. "Invalid credentials" / "Login failed"); stay on `/login` |
| 3 | Submit with non-existent email | Error message; stay on `/login` |
| 4 | Submit with invalid email format | Validation/error as per implementation |

### 2.3 Login — Loading & redirect

| Step | Action | Expected |
|------|--------|----------|
| 1 | Submit valid credentials | Button shows loading (e.g. "Signing in..."); then redirect |
| 2 | Open `/login` while already logged in | Redirect to `/admin/dashboard` |

### 2.4 Signup — Happy path

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/signup` | Form: name, email, password, confirm password, "Sign up", link to Sign in |
| 2 | Fill valid: name, email, new password, same confirm | Success; `refresh`; redirect to `/admin/dashboard` |

### 2.5 Signup — Validation

| Step | Action | Expected |
|------|--------|----------|
| 1 | Password ≠ Confirm | "Passwords do not match" (or similar) |
| 2 | Password &lt; 6 chars | "Password must be at least 6 characters long" |
| 3 | Email already exists | Error from API (e.g. "Email already registered") |
| 4 | Leave required fields empty | Required validation or disabled submit |

### 2.6 Signup — Redirect when logged in

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/signup` while logged in | Redirect to `/admin/dashboard` |

### 2.7 Logout

| Step | Action | Expected |
|------|--------|----------|
| 1 | Log in, then use "Sign Out" (navbar) | Redirect to `/login`; session cleared (no access to protected routes) |
| 2 | Open protected route after logout | Redirect to `/login` |

### 2.8 Session & protected routes (middleware)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/`, `/admin/dashboard`, `/admin/users`, etc. without `userId` + `sessionToken` cookies | Redirect to `/login` |
| 2 | Open `/login` or `/signup` | Allowed without session |
| 3 | Open `/api/auth/login`, `/api/auth/logout`, `/api/auth/signup` | Allowed (public in middleware) |

### 2.9 Root redirect

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/` unauthenticated | Redirect to `/login` |
| 2 | Open `/` authenticated | Redirect to `/admin/dashboard` |

---

## 3. Admin — Dashboard

### 3.1 Load & stats

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/admin/dashboard` as admin | Page loads; 6 stat cards: Teachers, Sections, Grade Levels, Curriculums, Class Sessions, Lectures |
| 2 | With empty Convex data | All counts = 0 |
| 3 | After adding teachers, sections, subjects, etc. | Counts match Convex data |

### 3.2 Loading & errors

| Step | Action | Expected |
|------|--------|----------|
| 1 | Convex not running / misconfigured | After timeout or missing `NEXT_PUBLIC_CONVEX_URL`: message about Convex and "Retry" |
| 2 | Click "Retry" | Page reloads |

---

## 4. Admin — Users

### 4.1 List users

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/admin/users` | List of users; cards show name, email, role (Admin/Teacher), teacher-link status |
| 2 | No users | Empty state + "Create User" CTA |

### 4.2 Create user

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Create User" | Modal: name, email, role (admin/teacher), password |
| 2 | Submit with valid data | Success toast; user appears in list |
| 3 | Submit without password | "Password is required for new users" or validation |
| 4 | Submit with duplicate email | Error toast (e.g. "Email already exists") |

### 4.3 Edit user

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Edit" on a user | Modal pre-filled; password optional "leave empty to keep current" |
| 2 | Change name/email/role, submit | Success; list updates |
| 3 | Set new password | Login with new password works |

### 4.4 Delete user

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click delete on user | Confirm: mentions deletion of teacher profile if linked |
| 2 | Confirm | User removed; if had teacher profile, that is removed (per backend) |
| 3 | Cancel | No change |

### 4.5 Link teacher profile

| Step | Action | Expected |
|------|--------|----------|
| 1 | For a user with role=teacher and no teacher profile | Card shows "No Teacher Profile" + "Link Teacher Profile" |
| 2 | Click "Link Teacher Profile" | Modal: name, email, subject checkboxes |
| 3 | Submit with name, email, ≥1 subject | Success; card shows "Linked to Teacher Profile" and subject count |
| 4 | With 0 subjects | Teacher created; subjects can be edited later in Teachers |

---

## 5. Admin — Teachers

### 5.1 List teachers

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/admin/teachers` | Cards: name, email, subject tags |
| 2 | No teachers | Empty state + "Add Teacher" (note: creation is via Users → Link Teacher) |

### 5.2 Edit teacher

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Edit" on teacher | Modal: name, email, subjects |
| 2 | Change name/email/subjects, submit | Success; card updates |

### 5.3 Delete teacher

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click delete | Confirm dialog |
| 2 | Confirm | Teacher removed; related lectures/sessions may be affected per schema |

### 5.4 Add teacher (from Teachers page)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Add Teacher" | Toast/warning: create via User management first (or form not allowing creation without userId) |

---

## 6. Admin — Sections

### 6.1 List sections

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/admin/sections` | Cards: name, grade, numberOfStudents, academicYear |
| 2 | No sections | Empty state + "Add Section" |

### 6.2 Create section

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Add Section" | Modal: name, grade, numberOfStudents, academicYear |
| 2 | Submit valid | Section appears in list |

### 6.3 Edit section

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click edit (pencil) | Modal pre-filled |
| 2 | Submit | Section updates |

### 6.4 Delete section

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click delete | Confirm; on confirm, section removed |

---

## 7. Admin — Curriculum (Subjects, Units, Lessons)

### 7.1 Subjects

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/admin/curriculum` | Three columns: Subjects, Units, Lessons |
| 2 | Click "Add Subject" | Modal: name, description |
| 3 | Submit | Subject in left column; select to see units |
| 4 | Edit/Delete subject | Modal or inline; delete cascades per backend |

### 7.2 Units

| Step | Action | Expected |
|------|--------|----------|
| 1 | Select a subject | "Add Unit" enabled |
| 2 | "Add Unit" | Modal: name, order, description |
| 3 | Submit | Unit in middle column; select to see lessons |
| 4 | Edit/Delete unit | Updates or removal; delete cascades as per backend |

### 7.3 Lessons

| Step | Action | Expected |
|------|--------|----------|
| 1 | Select a unit | "Add Lesson" enabled |
| 2 | "Add Lesson" | Modal: name, duration (min), order, prerequisites (other lessons) |
| 3 | Submit | Lesson in right column |
| 4 | Edit/Delete lesson | Updates or removal |

---

## 8. Admin — Periods

### 8.1 List & filter

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/admin/periods` | Academic year dropdown; cards: name (En/Ar), start–end time, order, isBreak |
| 2 | Change academic year | List filters to that year |

### 8.2 Seed default

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "Seed Default" | Confirm; creates 8 periods (7 + break) for selected year |
| 2 | After seed | Cards for First…Seventh + Break with correct times |

### 8.3 Add/Edit/Delete period

| Step | Action | Expected |
|------|--------|----------|
| 1 | "Add Period" | Modal: name, nameAr, startTime, endTime, order, "This is a break period" |
| 2 | Submit | New card in list |
| 3 | Edit | Modal pre-filled; submit updates |
| 4 | Delete | Confirm; period removed |

---

## 9. Admin — Class Sessions

### 9.1 List

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/admin/class-sessions` | Cards: curriculum (subject), section, teacher, date, time–endTime, optional period |
| 2 | No sessions | Empty state + "Add Class Session" |

### 9.2 Create class session

| Step | Action | Expected |
|------|--------|----------|
| 1 | "Add Class Session" | Modal: Section, Curriculum (subject), Teacher, Date, Period (optional), Time, End Time, Academic Year |
| 2 | Select Period | Time/End Time filled from period |
| 3 | Submit with valid data | Success toast; new card in list |
| 4 | Submit with missing required | Validation or backend error |

### 9.3 Edit / Delete

| Step | Action | Expected |
|------|--------|----------|
| 1 | Edit | Modal pre-filled; submit updates |
| 2 | Delete | Confirm; session removed |

---

## 10. Admin — Schedule (Lectures)

### 10.1 Period view

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/admin/schedule` | Academic year; "Period View" and "Calendar"; "Add Lecture" |
| 2 | Select "Period View" | Teacher dropdown; "Select a Teacher" placeholder if none |
| 3 | Select a teacher | Grid: periods (rows) × days; teacher’s lectures in cells |
| 4 | Click a lecture | Edit-lecture modal opens |

### 10.2 Calendar view

| Step | Action | Expected |
|------|--------|----------|
| 1 | Select "Calendar" | Week/Month toggles; calendar with lectures |
| 2 | Click lecture | Edit modal |

### 10.3 Add lecture

| Step | Action | Expected |
|------|--------|----------|
| 1 | "Add Lecture" | Modal: Teacher, Class, Lesson, Day of week, Period, Start/End (manual override), Academic Year, Recurring |
| 2 | Select Period | Start/End filled from period |
| 3 | Manual change of Start/End | Period selection cleared |
| 4 | Teacher chosen | Lesson dropdown filtered by teacher’s subjects |
| 5 | Submit valid | New lecture in period/calendar view |
| 6 | Conflict (same teacher or class, same slot) | "Conflicts detected" (teacher/class); may still allow save per implementation |

### 10.4 Edit lecture

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open edit from period/calendar | Form pre-filled; excludeLectureId used in conflict checks |
| 2 | Submit | Lecture updated; conflict check excludes current lecture |

### 10.5 Conflict detection (real-time)

| Step | Action | Expected |
|------|--------|----------|
| 1 | In Add/Edit, pick teacher+day+time that overlaps existing | "Teacher has X conflict(s)" or similar |
| 2 | Pick class+day+time that overlaps | "Class has X conflict(s)" |
| 3 | Resolve overlap | "No conflicts detected" (or green state) |

---

## 11. Teacher — Schedule

### 11.1 View own schedule

| Step | Action | Expected |
|------|--------|----------|
| 1 | Log in as teacher with linked teacher profile | Navbar; main content |
| 2 | Open `/teacher/schedule` | Teacher name in header; timetable by periods × days for that teacher |
| 3 | Teacher without profile or without lectures | Empty or “no lectures” state; no crash |

### 11.2 Language & year

| Step | Action | Expected |
|------|--------|----------|
| 1 | Switch language (e.g. ar/en) | Labels/titles update (e.g. "المعلمة X" / "Teacher X"); timetable labels if i18n applied |
| 2 | Academic year | Shown (can be disabled); data for that year |

### 11.3 Footer

| Step | Action | Expected |
|------|--------|----------|
| 1 | Check footer | "Created: DD/MM/YYYY" and school name (or env) |

---

## 12. Navigation & layout

### 12.1 Navbar (authenticated)

| Step | Action | Expected |
|------|--------|----------|
| 1 | As admin | Links: Dashboard, Users, Teachers, Sections, Class Sessions, Curriculum, Periods, Schedule; user initial/name; Sign Out |
| 2 | As teacher | Same links (if no role-based hiding); Sign Out |
| 3 | Click each link | Correct admin/teacher page |
| 4 | "School Schedule" / logo | Goes to `/admin/dashboard` |
| 5 | Mobile | Hamburger; open menu with same links and Sign Out |

### 12.2 Admin layout

| Step | Action | Expected |
|------|--------|----------|
| 1 | Unauthenticated | Redirect to `/login` |
| 2 | Authenticated | Navbar + main content for `/admin/*` |

### 12.3 Teacher layout

| Step | Action | Expected |
|------|--------|----------|
| 1 | Unauthenticated | Redirect to `/login` |
| 2 | Authenticated | Same Navbar + main for `/teacher/schedule` |

---

## 13. API routes

### 13.1 POST `/api/auth/login`

| Step | Action | Expected |
|------|--------|----------|
| 1 | `{ email, password }` valid | 200; `{ user }`; `userId` and `sessionToken` cookies set |
| 2 | Invalid credentials | 4xx; error message |
| 3 | Missing email/password | 4xx or validation error |

### 13.2 POST `/api/auth/logout`

| Step | Action | Expected |
|------|--------|----------|
| 1 | POST with session cookies | 200; cookies cleared |

### 13.3 POST `/api/auth/signup`

| Step | Action | Expected |
|------|--------|----------|
| 1 | `{ email, password, name }` valid, unique email | 200; user created; session set (if implementation does so) |
| 2 | Duplicate email | 4xx; error |
| 3 | Weak/short password | 4xx or validation |

### 13.4 GET `/api/auth/me`

| Step | Action | Expected |
|------|--------|----------|
| 1 | With valid session | 200; `{ user: { id, email, name, role } }` |
| 2 | Without/invalid session | 401 or 4xx; no user |

---

## 14. Convex & data integrity

### 14.1 Convex connectivity

| Step | Action | Expected |
|------|--------|----------|
| 1 | `npx convex dev` off | Queries undefined or timeout; Dashboard shows Convex-related error/Retry |
| 2 | Wrong or missing `NEXT_PUBLIC_CONVEX_URL` | Same as above |
| 3 | Convex running + correct URL | Data loads across Admin/Teacher pages |

### 14.2 Relations

| Step | Action | Expected |
|------|--------|----------|
| 1 | Delete teacher with lectures | Backend: error or cascade per schema |
| 2 | Delete section with class sessions | Same |
| 3 | Delete subject with units/lessons or teacher assignments | Same |
| 4 | Create class session with invalid sectionId/curriculumId/teacherId | 4xx or Convex error |

---

## 15. UI/UX & edge cases

### 15.1 Forms

| Step | Action | Expected |
|------|--------|----------|
| 1 | Submit forms during loading | Button disabled or loading state; no double submit |
| 2 | Cancel modals | Modal closes; no create/update |
| 3 | Form with long subject/unit/lesson lists | Scroll or pagination in dropdowns |
| 4 | Curriculum: subject/unit/lesson selection | Correct filtering (units by subject, lessons by unit) |

### 15.2 Toasts & errors

| Step | Action | Expected |
|------|--------|----------|
| 1 | Successful create/update/delete | Success toast where implemented |
| 2 | Failed mutation | Error toast or `alert` with message |
| 3 | Convex/network error | User-visible error, no silent failure |

### 15.3 Empty & loading

| Step | Action | Expected |
|------|--------|----------|
| 1 | Lists with no data | Empty state + primary CTA |
| 2 | Initial load | Skeleton or spinner; then content |
| 3 | Schedule: no teacher selected | "Select a Teacher" or similar |

---

## 16. Security & access (sanity checks)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Access `/admin/*` without session | Redirect to `/login` (middleware + layout) |
| 2 | Access `/teacher/schedule` without session | Redirect to `/login` |
| 3 | Direct API call to `/api/auth/me` without cookies | 401 or no user |
| 4 | Teacher accessing `/admin/users` | If no server/layout role check: page may load; mutations may be rejected by Convex if rules restrict |

---

## 17. Test data outline

Suggested minimal dataset:

- **Users**: admin@test.com (admin), teacher@test.com (teacher).
- **Teachers**: one teacher linked to teacher@test.com, 1–2 subjects.
- **Curriculum**: 1–2 subjects, each 1–2 units, 2–3 lessons.
- **Sections**: 1–2 sections (grade, academic year).
- **Periods**: for one academic year (e.g. Seed Default).
- **Class sessions**: 1–2 with section, curriculum, teacher, date, time.
- **Lectures**: 2–3 for the teacher, different days/periods; optionally one pair causing a conflict.

---

## 18. Regression / smoke checklist (short)

- [ ] Login with admin and teacher.
- [ ] Logout and confirm redirect to `/login`.
- [ ] Dashboard loads and shows non‑negative counts.
- [ ] Create user (teacher), link teacher profile with a subject.
- [ ] Create section, subject, unit, lesson.
- [ ] Seed periods for one year.
- [ ] Create class session and one lecture.
- [ ] Admin Schedule: period view for a teacher; add lecture; trigger conflict.
- [ ] Teacher Schedule: view own schedule; toggle language.
- [ ] Edit and delete at least one of: user, teacher, section, subject, unit, lesson, period, class session, lecture.

---

*Document version: 1.0 — Generated from codebase analysis.*
