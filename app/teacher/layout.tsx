import { Navbar } from "@/components/layout/navbar";
import { getCurrentUser } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Teachers can access this area
  // Admins can also access (to view teacher schedules if needed)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 pt-16 md:pt-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
