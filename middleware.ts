import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/signup", "/api/auth/login", "/api/auth/logout", "/api/auth/signup"];

// Session duration in milliseconds (7 days)
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for session cookies
  const userId = request.cookies.get("userId")?.value;
  const sessionToken = request.cookies.get("sessionToken")?.value;
  const sessionCreated = request.cookies.get("sessionCreated")?.value;

  // No session cookies - redirect to login
  if (!userId || !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check if session has expired
  if (sessionCreated) {
    const createdTime = parseInt(sessionCreated, 10);
    const now = Date.now();
    
    if (now - createdTime > SESSION_DURATION_MS) {
      // Session expired - redirect to login with message
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("expired", "true");
      
      // Create response and delete cookies
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("userId");
      response.cookies.delete("sessionToken");
      response.cookies.delete("sessionCreated");
      
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
