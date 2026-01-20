import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { AuthProvider } from "@/lib/auth-context";
import { ToastContainer } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "School Lecture Schedule",
  description: "Manage school lecture schedules with teachers and classes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <ConvexClientProvider>
          <AuthProvider>
            {children}
            <ToastContainer />
          </AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
