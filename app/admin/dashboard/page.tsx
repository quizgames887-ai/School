"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner, Skeleton } from "@/components/ui/loading";
import { Users, GraduationCap, BookOpen, Calendar, AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [error, setError] = useState<string | null>(null);
  const teachers = useQuery(api.queries.teachers.getAll);
  const classes = useQuery(api.queries.classes.getAll);
  const sections = useQuery(api.queries.sections.getAll);
  const subjects = useQuery(api.queries.subjects.getAll);
  const lectures = useQuery(api.queries.lectures.getAll);
  const classSessions = useQuery(api.queries.classSessions.getAll);

  // Debug logging and error detection
  useEffect(() => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    
    console.log("Dashboard Debug Info:", {
      convexUrl: convexUrl ? "Set" : "MISSING",
      teachers: teachers !== undefined ? `loaded (${teachers?.length || 0} items)` : "loading",
      classes: classes !== undefined ? `loaded (${classes?.length || 0} items)` : "loading",
      sections: sections !== undefined ? `loaded (${sections?.length || 0} items)` : "loading",
      subjects: subjects !== undefined ? `loaded (${subjects?.length || 0} items)` : "loading",
      lectures: lectures !== undefined ? `loaded (${lectures?.length || 0} items)` : "loading",
      classSessions: classSessions !== undefined ? `loaded (${classSessions?.length || 0} items)` : "loading",
    });

    // Check if Convex URL is missing
    if (!convexUrl) {
      setError("NEXT_PUBLIC_CONVEX_URL is not configured. Please set it in your .env.local file.");
    } else if (teachers === undefined && classes === undefined && sections === undefined && subjects === undefined && lectures === undefined && classSessions === undefined) {
      // If all queries are still undefined after a delay, show a warning
      const timer = setTimeout(() => {
        setError("Queries are taking longer than expected. Make sure 'npx convex dev' is running.");
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setError(null);
    }
  }, [teachers, classes, sections, subjects, lectures, classSessions]);

  const isLoading = teachers === undefined || classes === undefined || sections === undefined || subjects === undefined || lectures === undefined || classSessions === undefined;

  const stats = [
    {
      title: "Teachers",
      value: teachers?.length || 0,
      description: "Total registered teachers",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Sections",
      value: sections?.length || 0,
      description: "Class sections",
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Grade Levels",
      value: classes?.length || 0,
      description: "Active grade levels",
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Curriculums",
      value: subjects?.length || 0,
      description: "Curriculum subjects",
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Class Sessions",
      value: classSessions?.length || 0,
      description: "Scheduled class sessions",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Lectures",
      value: lectures?.length || 0,
      description: "Legacy lectures",
      icon: Calendar,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Loading dashboard data...</p>
        </div>
        
        {error && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="flex items-start gap-3 p-6">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">Connection Issue</h3>
                <p className="mt-1 text-sm text-yellow-700">{error}</p>
                <div className="mt-3 space-y-2 text-xs text-yellow-600">
                  <p>• Make sure you have run: <code className="bg-yellow-100 px-1 rounded">npx convex dev</code></p>
                  <p>• Check that NEXT_PUBLIC_CONVEX_URL is set in your .env.local file</p>
                  <p>• Verify the Convex dev server is running and connected</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-3 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of your school schedule system</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <CardDescription className="mt-1 text-xs">
                  {stat.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
