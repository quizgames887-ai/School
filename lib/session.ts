import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_CONVEX_URL\n" +
    "Please set NEXT_PUBLIC_CONVEX_URL in your .env.local file.\n" +
    "You can get your Convex deployment URL by running 'npx convex dev' or from your Convex dashboard."
  );
}

const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Session configuration
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Generate a cryptographically secure session token
 */
function generateSessionToken(): string {
  // Use crypto.randomUUID for a secure unique identifier
  // Combined with timestamp for additional uniqueness
  const uuid = crypto.randomUUID();
  const timestamp = Date.now().toString(36);
  return `${uuid}-${timestamp}`;
}

/**
 * Create a new session for a user
 * @param userId - The user's ID
 */
export async function createSession(userId: Id<"users">) {
  const cookieStore = await cookies();
  
  // Generate a secure session token
  const sessionToken = generateSessionToken();
  
  // Set user ID cookie
  cookieStore.set("userId", userId, {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_DURATION,
  });
  
  // Set session token cookie
  cookieStore.set("sessionToken", sessionToken, {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_DURATION,
  });
  
  // Set session creation timestamp (for session validation)
  cookieStore.set("sessionCreated", Date.now().toString(), {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_DURATION,
  });
}

/**
 * Get the current session
 * @returns Session data or null if no valid session
 */
export async function getSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const sessionToken = cookieStore.get("sessionToken")?.value;
  const sessionCreated = cookieStore.get("sessionCreated")?.value;

  // Check if all session cookies exist
  if (!userId || !sessionToken) {
    return null;
  }

  // Validate session age (optional additional check)
  if (sessionCreated) {
    const createdTime = parseInt(sessionCreated, 10);
    const now = Date.now();
    const maxAge = SESSION_DURATION * 1000; // Convert to milliseconds
    
    if (now - createdTime > maxAge) {
      // Session has expired
      await deleteSession();
      return null;
    }
  }

  try {
    // Fetch user data from Convex
    const user = await convexClient.query(api.queries.users.getById, {
      id: userId as Id<"users">,
    });

    if (!user) {
      // User no longer exists, clear session
      await deleteSession();
      return null;
    }

    return {
      userId: user._id,
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch (error) {
    console.error("Error fetching user session:", error);
    return null;
  }
}

/**
 * Delete the current session (logout)
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  
  // Delete all session-related cookies
  cookieStore.delete("userId");
  cookieStore.delete("sessionToken");
  cookieStore.delete("sessionCreated");
}

/**
 * Refresh the session (extend expiration)
 */
export async function refreshSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const sessionToken = cookieStore.get("sessionToken")?.value;

  if (!userId || !sessionToken) {
    return false;
  }

  // Update session creation time to extend the session
  cookieStore.set("sessionCreated", Date.now().toString(), {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_DURATION,
  });

  // Re-set the other cookies to refresh their expiration
  cookieStore.set("userId", userId, {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_DURATION,
  });

  cookieStore.set("sessionToken", sessionToken, {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_DURATION,
  });

  return true;
}
