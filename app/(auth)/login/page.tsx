"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Clock } from "lucide-react";

function LoginForm() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  // Check if redirected due to session expiry
  const sessionExpired = searchParams.get("expired") === "true";

  useEffect(() => {
    if (user) {
      router.push("/admin/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      // Clear password field after successful login
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Login failed");
      // Clear password field after failed login for security
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white/90 backdrop-blur-lg p-8 shadow-2xl ring-1 ring-gray-200/50 animate-fadeIn">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            {logoError ? (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white shadow-lg shadow-blue-500/30">
                <span className="text-2xl font-bold">AIS</span>
              </div>
            ) : (
              <Image
                src="/logo.png"
                alt="Alahed International Schools"
                width={80}
                height={80}
                className="object-contain rounded-xl"
                priority
                unoptimized
                onError={() => setLogoError(true)}
              />
            )}
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Alahed International Schools
          </h2>
          <h3 className="mt-2 text-lg font-semibold text-gray-700">
            Sign in to your account
          </h3>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {sessionExpired && (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Session Expired</p>
                  <p className="text-xs text-amber-600 mt-0.5">Your session has expired due to inactivity. Please sign in again.</p>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 p-4 shadow-sm animate-fadeIn">
              <p className="text-sm font-semibold text-red-800">{error}</p>
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-400"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-400"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-md shadow-blue-500/30 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
