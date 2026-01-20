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
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
    { href: "/admin/sections", label: "Sections", icon: Users },
    { href: "/admin/class-sessions", label: "Class Sessions", icon: Calendar },
    { href: "/admin/curriculum", label: "Curriculum", icon: BookOpen },
    { href: "/admin/periods", label: "Periods", icon: Clock },
    { href: "/admin/schedule", label: "Schedule", icon: Calendar },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              <div className="relative h-10 w-10 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Alahed International Schools"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 leading-tight">
                  Alahed International Schools
                </span>
                <span className="text-xs text-gray-600 leading-tight hidden sm:block">
                  School Schedule
                </span>
              </div>
            </Link>
            <div className="ml-10 hidden space-x-1 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user.name || user.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:flex"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
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
              <div className="px-3 py-2 text-sm font-medium text-gray-700">
                {user.name || user.email}
          </div>
            <button
              onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
            >
                <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
      )}
    </nav>
  );
}
