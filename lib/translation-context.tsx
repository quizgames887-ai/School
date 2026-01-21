"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface TranslationContextType {
  language: "en" | "ar";
  t: (key: string, fallback?: string) => string;
  translations: Record<string, { en: string; ar: string }>;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType>({
  language: "en",
  t: (key, fallback) => fallback || key,
  translations: {},
  isLoading: true,
});

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const translationsData = useQuery(api.queries.translations.getAllAsMap);
  const languageSetting = useQuery(api.queries.translations.getLanguageSetting);

  const language = (languageSetting as "en" | "ar") || "en";
  const isLoading = translationsData === undefined || languageSetting === undefined;

  const translations = useMemo(() => {
    return translationsData || {};
  }, [translationsData]);

  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      const translation = translations[key];
      if (translation) {
        return language === "ar" ? translation.ar : translation.en;
      }
      return fallback || key;
    };
  }, [translations, language]);

  return (
    <TranslationContext.Provider value={{ language, t, translations, isLoading }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}

// Static fallback translations for when the database is not available
export const STATIC_TRANSLATIONS: Record<string, { en: string; ar: string }> = {
  // Navigation
  "nav.dashboard": { en: "Dashboard", ar: "لوحة التحكم" },
  "nav.users": { en: "Users", ar: "المستخدمين" },
  "nav.teachers": { en: "Teachers", ar: "المعلمين" },
  "nav.sections": { en: "Sections", ar: "الأقسام" },
  "nav.classSessions": { en: "Class Sessions", ar: "الحصص الدراسية" },
  "nav.curriculum": { en: "Curriculum", ar: "المنهج" },
  "nav.periods": { en: "Periods", ar: "الفترات" },
  "nav.schedule": { en: "Schedule", ar: "الجدول" },
  "nav.translations": { en: "Translations", ar: "الترجمات" },
  "nav.mySchedule": { en: "My Schedule", ar: "جدولي" },
  "nav.signOut": { en: "Sign Out", ar: "تسجيل الخروج" },
  
  // Common
  "common.save": { en: "Save", ar: "حفظ" },
  "common.cancel": { en: "Cancel", ar: "إلغاء" },
  "common.delete": { en: "Delete", ar: "حذف" },
  "common.edit": { en: "Edit", ar: "تعديل" },
  "common.add": { en: "Add", ar: "إضافة" },
  "common.search": { en: "Search", ar: "بحث" },
  "common.filter": { en: "Filter", ar: "تصفية" },
  "common.clear": { en: "Clear", ar: "مسح" },
  "common.loading": { en: "Loading...", ar: "جاري التحميل..." },
  "common.noData": { en: "No data available", ar: "لا توجد بيانات" },
  "common.actions": { en: "Actions", ar: "الإجراءات" },
  
  // Days
  "days.sunday": { en: "Sunday", ar: "الأحد" },
  "days.monday": { en: "Monday", ar: "الإثنين" },
  "days.tuesday": { en: "Tuesday", ar: "الثلاثاء" },
  "days.wednesday": { en: "Wednesday", ar: "الأربعاء" },
  "days.thursday": { en: "Thursday", ar: "الخميس" },
  "days.friday": { en: "Friday", ar: "الجمعة" },
  "days.saturday": { en: "Saturday", ar: "السبت" },
};

// Helper function for static translations (when context is not available)
export function getStaticTranslation(key: string, language: "en" | "ar", fallback?: string): string {
  const translation = STATIC_TRANSLATIONS[key];
  if (translation) {
    return language === "ar" ? translation.ar : translation.en;
  }
  return fallback || key;
}
