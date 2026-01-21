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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/translation-context";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { t } = useTranslation();

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

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null;

  // Use appropriate nav items based on role
  const navItems = user.role === "admin" ? adminNavItems : teacherNavItems;
  const homeHref = user.role === "admin" ? "/admin/dashboard" : "/teacher/schedule";

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
        <Link href={homeHref} className="flex items-center gap-2">
          <div className="relative h-8 w-8 flex-shrink-0">
            {logoError ? (
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <span className="text-xs font-bold">AIS</span>
              </div>
            ) : (
              <Image
                src="/logo.png"
                alt="AIS"
                fill
                className="object-contain rounded-lg"
                priority
                unoptimized
                onError={() => setLogoError(true)}
              />
            )}
          </div>
          <span className="text-sm font-bold text-gray-900">AIS</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile slide-out menu */}
      <div
        className={`fixed top-14 left-0 bottom-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-4 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="border-t border-gray-200 p-3">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-semibold text-white">
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-700 truncate">{user.name || user.email}</div>
                <div className="text-xs text-gray-500 capitalize">{user.role}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              {t("nav.signOut", "Sign Out")}
            </button>
          </div>
        </nav>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 hidden md:flex flex-col border-r border-gray-200 bg-white shadow-sm transition-all duration-300 ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-3 border-b border-gray-100">
          <Link href={homeHref} className="flex items-center gap-2 overflow-hidden">
            <div className="relative h-9 w-9 flex-shrink-0">
              {logoError ? (
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
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
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                  Alahed International
                </span>
                <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                  Schools
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} rounded-lg px-3 py-2.5 mb-1 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 p-2">
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-2 py-2`}>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-semibold text-white">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-700 truncate">{user.name || user.email}</div>
                <div className="text-xs text-gray-500 capitalize">{user.role}</div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={`w-full ${collapsed ? "justify-center px-0" : "justify-start"} text-red-600 hover:bg-red-50 hover:text-red-700`}
            title={collapsed ? t("nav.signOut", "Sign Out") : undefined}
          >
            <LogOut className={`h-4 w-4 ${collapsed ? "" : "mr-2"}`} />
            {!collapsed && t("nav.signOut", "Sign Out")}
          </Button>
        </div>
      </aside>

      {/* Spacer for main content */}
      <div className={`hidden md:block transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`} />
      <div className="h-14 md:hidden" />
    </>
  );
}
