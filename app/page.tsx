import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";

export default async function Home() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  // Redirect based on user role
  if (user.role === "teacher") {
    redirect("/teacher/schedule");
  }
  
  // Default to admin dashboard for admin users
  redirect("/admin/dashboard");
}
