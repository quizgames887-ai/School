import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { AuthProvider } from "@/lib/auth-context";
import { ToastContainer } from "@/components/ui/toast";
import { SessionTimeoutHandler } from "@/components/SessionTimeoutHandler";

export const metadata: Metadata = {
  title: "Alahed International Schools - Schedule Management",
  description: "Manage school lecture schedules with teachers and classes for Alahed International Schools",
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
            <SessionTimeoutHandler />
            <ToastContainer />
          </AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
