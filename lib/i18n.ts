// Internationalization utilities for Arabic support

export const DAYS_AR = [
  "احد",      // Sunday
  "اثنين",    // Monday
  "ثلاثاء",   // Tuesday
  "اربعاء",   // Wednesday
  "خميس",     // Thursday
  "جمعة",     // Friday
  "سبت",      // Saturday
];

export const DAYS_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function getDayName(dayIndex: number, lang: "ar" | "en" = "en"): string {
  if (lang === "ar") {
    return DAYS_AR[dayIndex] || "";
  }
  return DAYS_EN[dayIndex] || "";
}

export function translatePeriodName(
  period: { name: string; nameAr?: string },
  lang: "ar" | "en" = "en"
): string {
  if (lang === "ar" && period.nameAr) {
    return period.nameAr;
  }
  return period.name;
}

export const LABELS = {
  en: {
    teacher: "Teacher",
    schedule: "Schedule",
    created: "Schedule created",
    period: "Period",
    break: "Break",
    subject: "Subject",
    class: "Class",
  },
  ar: {
    teacher: "المعلمة",
    schedule: "الجدول",
    created: "تم إنشاء الجدول",
    period: "الحصة",
    break: "فرصة",
    subject: "المادة",
    class: "الصف",
  },
};

export function t(key: keyof typeof LABELS.en, lang: "ar" | "en" = "en"): string {
  return LABELS[lang][key] || LABELS.en[key];
}
