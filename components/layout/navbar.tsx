"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Clock,
  Calendar,
  LogOut,
  Menu,
  X,
  Languages,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/translation-context";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);

  // Define navigation items based on user role - using translations
  const adminNavItems = [
    { href: "/admin/dashboard", label: t("nav.dashboard", "Dashboard"), icon: LayoutDashboard },
    { href: "/admin/users", label: t("nav.users", "Users"), icon: Users },
    { href: "/admin/teachers", label: t("nav.teachers", "Teachers"), icon: GraduationCap },
    { href: "/admin/sections", label: t("nav.sections", "Sections"), icon: Users },
    { href: "/admin/class-sessions", label: t("nav.classSessions", "Class Sessions"), icon: Calendar },
    { href: "/admin/curriculum", label: t("nav.curriculum", "Curriculum"), icon: BookOpen },
    { href: "/admin/periods", label: t("nav.periods", "Periods"), icon: Clock },
    { href: "/admin/schedule", label: t("nav.schedule", "Schedule"), icon: Calendar },
    { href: "/admin/translations", label: t("nav.translations", "Translations"), icon: Languages },
  ];

  const teacherNavItems = [
    { href: "/teacher/schedule", label: t("nav.mySchedule", "My Schedule"), icon: Calendar },
  ];

  // Use appropriate nav items based on role
  const navItems = user.role === "admin" ? adminNavItems : teacherNavItems;
  const homeHref = user.role === "admin" ? "/admin/dashboard" : "/teacher/schedule";

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const navItems = navItemsRef.current;
      // #region agent log
      fetch("http://127.0.0.1:7244/ingest/42a76cd6-c3b4-41d8-a6da-d645a23f4e18", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "components/layout/navbar.tsx:measure",
          message: "Navbar layout metrics",
          data: {
            windowWidth: typeof window !== "undefined" ? window.innerWidth : null,
            containerClientWidth: container?.clientWidth ?? null,
            navItemsClientWidth: navItems?.clientWidth ?? null,
            navItemsScrollWidth: navItems?.scrollWidth ?? null,
            navItemsOverflow:
              navItems && navItems.scrollWidth > navItems.clientWidth,
            navItemCount: navItems?.childElementCount ?? null,
            isDesktop: typeof window !== "undefined" ? window.innerWidth >= 768 : null,
          },
          timestamp: Date.now(),
          sessionId: "debug-session",
          hypothesisId: "A",
        }),
      }).catch(() => {});
      // #endregion
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [navItems.length]);

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-lg shadow-sm">
      <div ref={containerRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link
              href={homeHref}
              className="flex items-center gap-3 transition-all duration-200 hover:opacity-80 hover:scale-105"
            >
              <div className="relative h-10 w-10 flex-shrink-0">
                {logoError ? (
                  <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                    <span className="text-xs font-bold">AIS</span>
                  </div>
                ) : (
                  <Image
                    src="/logo.png"
                    alt="Alahed International Schools"
                    fill
                    className="object-contain rounded-lg"
                    priority
                    unoptimized
                    onError={() => setLogoError(true)}
                  />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                  Alahed International Schools
                </span>
                {user.role === "teacher" && (
                  <span className="text-xs text-gray-500">Teacher Portal</span>
                )}
              </div>
            </Link>
            <div ref={navItemsRef} className="ml-10 hidden space-x-1 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isIconOnly = item.href === "/admin/translations";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center ${
                      isIconOnly ? "justify-center" : "gap-2"
                    } rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900"
                    }`}
                    title={item.label}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : ""}`} />
                    {!isIconOnly && item.label}
                    {isIconOnly && <span className="sr-only">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-semibold text-white shadow-md shadow-blue-500/30">
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  {user.name || user.email}
                </span>
                <span className="text-xs text-gray-500 capitalize">{user.role}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:flex hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("nav.signOut", "Sign Out")}
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 transition-colors md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            <div className="border-t border-gray-200 pt-2">
              <div className="px-3 py-2">
                <div className="text-sm font-medium text-gray-700">
                  {user.name || user.email}
                </div>
                <div className="text-xs text-gray-500 capitalize">{user.role}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5" />
                {t("nav.signOut", "Sign Out")}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
