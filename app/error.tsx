"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error("Error boundary caught an error:", error);
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600">
            Something went wrong!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-gray-700 font-medium mb-2">Error Message:</p>
            <p className="text-red-600 bg-red-50 p-3 rounded-md">
              {error.message || "An unexpected error occurred"}
            </p>
          </div>

          {error.digest && (
            <div>
              <p className="text-gray-700 font-medium mb-2">Error ID:</p>
              <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                {error.digest}
              </p>
            </div>
          )}

          {isDevelopment && error.stack && (
            <div>
              <p className="text-gray-700 font-medium mb-2">Stack Trace:</p>
              <pre className="text-xs text-gray-600 p-4 bg-gray-100 rounded-md overflow-auto max-h-96 border border-gray-200">
                {error.stack}
              </pre>
            </div>
          )}

          {!isDevelopment && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                If this problem persists, please contact support with the Error ID above.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={reset} variant="default">
              Try again
            </Button>
            <Button
              onClick={() => window.location.href = "/"}
              variant="outline"
            >
              Go to home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
