"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { toast } from "@/components/ui/toast";
import {
  Languages,
  Plus,
  X,
  Search,
  Trash2,
  Edit2,
  Save,
  Globe,
  Filter,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

// Default translations to seed
const DEFAULT_TRANSLATIONS = [
  // Navigation
  { key: "nav.dashboard", category: "navigation", en: "Dashboard", ar: "لوحة التحكم" },
  { key: "nav.users", category: "navigation", en: "Users", ar: "المستخدمين" },
  { key: "nav.teachers", category: "navigation", en: "Teachers", ar: "المعلمين" },
  { key: "nav.sections", category: "navigation", en: "Sections", ar: "الأقسام" },
  { key: "nav.classSessions", category: "navigation", en: "Class Sessions", ar: "الحصص الدراسية" },
  { key: "nav.curriculum", category: "navigation", en: "Curriculum", ar: "المنهج" },
  { key: "nav.periods", category: "navigation", en: "Periods", ar: "الفترات" },
  { key: "nav.schedule", category: "navigation", en: "Schedule", ar: "الجدول" },
  { key: "nav.translations", category: "navigation", en: "Translations", ar: "الترجمات" },
  { key: "nav.mySchedule", category: "navigation", en: "My Schedule", ar: "جدولي" },
  { key: "nav.signOut", category: "navigation", en: "Sign Out", ar: "تسجيل الخروج" },
  
  // Common
  { key: "common.save", category: "common", en: "Save", ar: "حفظ" },
  { key: "common.cancel", category: "common", en: "Cancel", ar: "إلغاء" },
  { key: "common.delete", category: "common", en: "Delete", ar: "حذف" },
  { key: "common.edit", category: "common", en: "Edit", ar: "تعديل" },
  { key: "common.add", category: "common", en: "Add", ar: "إضافة" },
  { key: "common.search", category: "common", en: "Search", ar: "بحث" },
  { key: "common.filter", category: "common", en: "Filter", ar: "تصفية" },
  { key: "common.clear", category: "common", en: "Clear", ar: "مسح" },
  { key: "common.loading", category: "common", en: "Loading...", ar: "جاري التحميل..." },
  { key: "common.noData", category: "common", en: "No data available", ar: "لا توجد بيانات" },
  { key: "common.actions", category: "common", en: "Actions", ar: "الإجراءات" },
  { key: "common.name", category: "common", en: "Name", ar: "الاسم" },
  { key: "common.email", category: "common", en: "Email", ar: "البريد الإلكتروني" },
  { key: "common.role", category: "common", en: "Role", ar: "الدور" },
  { key: "common.admin", category: "common", en: "Admin", ar: "مسؤول" },
  { key: "common.teacher", category: "common", en: "Teacher", ar: "معلم" },
  
  // Schedule
  { key: "schedule.title", category: "schedule", en: "Schedule", ar: "الجدول" },
  { key: "schedule.weeklySchedule", category: "schedule", en: "Weekly Schedule", ar: "الجدول الأسبوعي" },
  { key: "schedule.addLecture", category: "schedule", en: "Add Lecture", ar: "إضافة حصة" },
  { key: "schedule.editLecture", category: "schedule", en: "Edit Lecture", ar: "تعديل حصة" },
  { key: "schedule.deleteLecture", category: "schedule", en: "Delete Lecture", ar: "حذف حصة" },
  { key: "schedule.teacher", category: "schedule", en: "Teacher", ar: "المعلم" },
  { key: "schedule.section", category: "schedule", en: "Section", ar: "القسم" },
  { key: "schedule.subject", category: "schedule", en: "Subject", ar: "المادة" },
  { key: "schedule.lesson", category: "schedule", en: "Lesson", ar: "الدرس" },
  { key: "schedule.period", category: "schedule", en: "Period", ar: "الحصة" },
  { key: "schedule.day", category: "schedule", en: "Day", ar: "اليوم" },
  { key: "schedule.academicYear", category: "schedule", en: "Academic Year", ar: "العام الدراسي" },
  { key: "schedule.noLectures", category: "schedule", en: "No lectures scheduled", ar: "لا توجد حصص مجدولة" },
  { key: "schedule.totalLectures", category: "schedule", en: "Total Lectures Per Week", ar: "إجمالي الحصص في الأسبوع" },
  { key: "schedule.availableReplacements", category: "schedule", en: "Available Replacements", ar: "البدائل المتاحين" },
  
  // Days
  { key: "days.sunday", category: "days", en: "Sunday", ar: "الأحد" },
  { key: "days.monday", category: "days", en: "Monday", ar: "الإثنين" },
  { key: "days.tuesday", category: "days", en: "Tuesday", ar: "الثلاثاء" },
  { key: "days.wednesday", category: "days", en: "Wednesday", ar: "الأربعاء" },
  { key: "days.thursday", category: "days", en: "Thursday", ar: "الخميس" },
  { key: "days.friday", category: "days", en: "Friday", ar: "الجمعة" },
  { key: "days.saturday", category: "days", en: "Saturday", ar: "السبت" },
  
  // Periods
  { key: "periods.first", category: "periods", en: "First", ar: "الأولى" },
  { key: "periods.second", category: "periods", en: "Second", ar: "الثانية" },
  { key: "periods.third", category: "periods", en: "Third", ar: "الثالثة" },
  { key: "periods.fourth", category: "periods", en: "Fourth", ar: "الرابعة" },
  { key: "periods.fifth", category: "periods", en: "Fifth", ar: "الخامسة" },
  { key: "periods.sixth", category: "periods", en: "Sixth", ar: "السادسة" },
  { key: "periods.seventh", category: "periods", en: "Seventh", ar: "السابعة" },
  { key: "periods.break", category: "periods", en: "Break", ar: "فرصة" },
  
  // Auth
  { key: "auth.login", category: "auth", en: "Login", ar: "تسجيل الدخول" },
  { key: "auth.logout", category: "auth", en: "Logout", ar: "تسجيل الخروج" },
  { key: "auth.email", category: "auth", en: "Email", ar: "البريد الإلكتروني" },
  { key: "auth.password", category: "auth", en: "Password", ar: "كلمة المرور" },
  { key: "auth.signIn", category: "auth", en: "Sign In", ar: "دخول" },
  { key: "auth.signUp", category: "auth", en: "Sign Up", ar: "تسجيل" },
  
  // Messages
  { key: "messages.success", category: "messages", en: "Success", ar: "نجاح" },
  { key: "messages.error", category: "messages", en: "Error", ar: "خطأ" },
  { key: "messages.saved", category: "messages", en: "Saved successfully", ar: "تم الحفظ بنجاح" },
  { key: "messages.deleted", category: "messages", en: "Deleted successfully", ar: "تم الحذف بنجاح" },
  { key: "messages.confirmDelete", category: "messages", en: "Are you sure you want to delete?", ar: "هل أنت متأكد من الحذف؟" },
];

interface TranslationFormProps {
  onClose: () => void;
  existingTranslation?: {
    _id: Id<"translations">;
    key: string;
    category: string;
    en: string;
    ar: string;
  } | null;
}

function TranslationForm({ onClose, existingTranslation }: TranslationFormProps) {
  const [key, setKey] = useState(existingTranslation?.key || "");
  const [category, setCategory] = useState(existingTranslation?.category || "common");
  const [en, setEn] = useState(existingTranslation?.en || "");
  const [ar, setAr] = useState(existingTranslation?.ar || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTranslation = useMutation(api.mutations.translations.create);
  const updateTranslation = useMutation(api.mutations.translations.update);

  const categories = [
    "navigation",
    "common",
    "schedule",
    "days",
    "periods",
    "auth",
    "messages",
    "dashboard",
    "users",
    "teachers",
    "sections",
    "curriculum",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (existingTranslation) {
        await updateTranslation({
          id: existingTranslation._id,
          key,
          category,
          en,
          ar,
        });
        toast.success("Translation updated successfully");
      } else {
        await createTranslation({ key, category, en, ar });
        toast.success("Translation created successfully");
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to save translation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-blue-600" />
              {existingTranslation ? "Edit Translation" : "Add Translation"}
            </CardTitle>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g., nav.dashboard"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                English
              </label>
              <input
                type="text"
                value={en}
                onChange={(e) => setEn(e.target.value)}
                placeholder="English translation"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arabic (العربية)
              </label>
              <input
                type="text"
                value={ar}
                onChange={(e) => setAr(e.target.value)}
                placeholder="الترجمة العربية"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-right"
                dir="rtl"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {existingTranslation ? "Update" : "Create"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TranslationsPage() {
  const translations = useQuery(api.queries.translations.getAll);
  const currentLanguage = useQuery(api.queries.translations.getLanguageSetting);
  const bulkCreate = useMutation(api.mutations.translations.bulkCreate);
  const deleteTranslation = useMutation(api.mutations.translations.remove);
  const setLanguage = useMutation(api.mutations.translations.setLanguage);

  const [showForm, setShowForm] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [isSeeding, setIsSeeding] = useState(false);

  // Get unique categories from translations
  const categories = useMemo(() => {
    if (!translations) return [];
    const cats = new Set<string>();
    translations.forEach((t) => cats.add(t.category));
    return Array.from(cats).sort();
  }, [translations]);

  // Filter translations
  const filteredTranslations = useMemo(() => {
    if (!translations) return [];
    return translations.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ar.includes(searchQuery);
      const matchesCategory = !filterCategory || t.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [translations, searchQuery, filterCategory]);

  // Group translations by category
  const translationsByCategory = useMemo(() => {
    const grouped: Record<string, typeof filteredTranslations> = {};
    for (const t of filteredTranslations) {
      if (!grouped[t.category]) {
        grouped[t.category] = [];
      }
      grouped[t.category].push(t);
    }
    return grouped;
  }, [filteredTranslations]);

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      await bulkCreate({ translations: DEFAULT_TRANSLATIONS });
      toast.success("Default translations seeded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to seed translations");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDelete = async (id: Id<"translations">, key: string) => {
    if (!confirm(`Are you sure you want to delete "${key}"?`)) return;
    try {
      await deleteTranslation({ id });
      toast.success("Translation deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete translation");
    }
  };

  const handleLanguageChange = async (lang: "en" | "ar") => {
    try {
      await setLanguage({ language: lang });
      toast.success(`Language changed to ${lang === "en" ? "English" : "Arabic"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to change language");
    }
  };

  if (translations === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Languages className="h-7 w-7 text-blue-600" />
            Translations
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage Arabic and English translations for the application
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Language Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2 shadow-sm">
            <Globe className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">App Language:</span>
            <button
              onClick={() => handleLanguageChange("en")}
              className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                currentLanguage === "en"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageChange("ar")}
              className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                currentLanguage === "ar"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              AR
            </button>
          </div>
          
          <Button
            variant="outline"
            onClick={handleSeedDefaults}
            disabled={isSeeding}
          >
            {isSeeding ? <LoadingSpinner size="sm" /> : "Seed Defaults"}
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Translation
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by key, English, or Arabic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
              {(searchQuery || filterCategory) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterCategory("");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {translations.length}
            </div>
            <div className="text-sm text-gray-500">Total Translations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {categories.length}
            </div>
            <div className="text-sm text-gray-500">Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {filteredTranslations.length}
            </div>
            <div className="text-sm text-gray-500">Filtered Results</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {currentLanguage === "ar" ? "العربية" : "English"}
            </div>
            <div className="text-sm text-gray-500">Current Language</div>
          </CardContent>
        </Card>
      </div>

      {/* Translations Table by Category */}
      {Object.keys(translationsByCategory).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Languages className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Translations Found
            </h3>
            <p className="text-gray-500 mb-4">
              {translations.length === 0
                ? "Get started by seeding default translations or adding new ones."
                : "No translations match your search criteria."}
            </p>
            {translations.length === 0 && (
              <Button onClick={handleSeedDefaults} disabled={isSeeding}>
                {isSeeding ? <LoadingSpinner size="sm" /> : "Seed Default Translations"}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        Object.entries(translationsByCategory)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, items]) => (
            <Card key={category}>
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                    {category}
                  </span>
                  <span className="text-sm text-gray-500 font-normal">
                    ({items.length} translations)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Key
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          English
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          العربية (Arabic)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((t) => (
                        <tr
                          key={t._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {t.key}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {t.en}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right" dir="rtl">
                            {t.ar}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingTranslation(t);
                                  setShowForm(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(t._id, t.key)}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
      )}

      {/* Form Modal */}
      {showForm && (
        <TranslationForm
          onClose={() => {
            setShowForm(false);
            setEditingTranslation(null);
          }}
          existingTranslation={editingTranslation}
        />
      )}
    </div>
  );
}
