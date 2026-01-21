"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { TranslationProvider } from "./translation-context";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.error(
    "Missing NEXT_PUBLIC_CONVEX_URL environment variable. " +
    "Please set it in your .env.local file. " +
    "You can get your Convex URL by running 'npx convex dev'"
  );
}

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Configuration Error</h2>
          <p className="mt-2 text-gray-600">
            Convex URL is not configured. Please set NEXT_PUBLIC_CONVEX_URL in your .env.local file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <TranslationProvider>{children}</TranslationProvider>
    </ConvexProvider>
  );
}
