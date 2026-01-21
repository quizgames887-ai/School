import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { createSession, deleteSession } from "@/lib/session";
import { verifyPassword, hashPassword } from "@/lib/password";

// Disable static caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_CONVEX_URL\n" +
    "Please set NEXT_PUBLIC_CONVEX_URL in your .env.local file.\n" +
    "You can get your Convex deployment URL by running 'npx convex dev' or from your Convex dashboard."
  );
}

const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

/**
 * Legacy hash function for backward compatibility with old passwords
 * @deprecated - Only used for migration, will be removed in future
 */
function legacyHashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

// Simple rate limiting (in-memory, resets on server restart)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(email: string): { allowed: boolean; remainingTime?: number } {
  const now = Date.now();
  const attempts = loginAttempts.get(email);
  
  if (!attempts) {
    return { allowed: true };
  }
  
  // Reset if lockout period has passed
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(email);
    return { allowed: true };
  }
  
  if (attempts.count >= MAX_ATTEMPTS) {
    const remainingTime = Math.ceil((LOCKOUT_DURATION - (now - attempts.lastAttempt)) / 1000 / 60);
    return { allowed: false, remainingTime };
  }
  
  return { allowed: true };
}

function recordFailedAttempt(email: string) {
  const now = Date.now();
  const attempts = loginAttempts.get(email);
  
  if (!attempts) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
  } else {
    loginAttempts.set(email, { count: attempts.count + 1, lastAttempt: now });
  }
}

function clearAttempts(email: string) {
  loginAttempts.delete(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Trim email and password to handle whitespace issues
    const email = body.email?.trim()?.toLowerCase(); // Normalize email to lowercase
    const password = body.password?.trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check rate limiting
    const rateLimit = checkRateLimit(email);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${rateLimit.remainingTime} minutes.` },
        { status: 429 }
      );
    }

    // Find user by email
    const user = await convexClient.query(api.queries.users.getByEmail, {
      email,
    });

    // Use constant-time comparison to prevent timing attacks
    // Even if user doesn't exist, we still do a password check
    if (!user) {
      // Perform a dummy password check to prevent timing attacks
      await verifyPassword(password, "$2a$12$dummyhashtopreventtimingattacks000000000000000000");
      recordFailedAttempt(email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if password hash is in bcrypt format (starts with $2a$ or $2b$)
    const isBcryptHash = user.passwordHash?.startsWith("$2a$") || user.passwordHash?.startsWith("$2b$");
    
    let isValidPassword = false;
    
    if (isBcryptHash) {
      // Verify using bcrypt
      isValidPassword = await verifyPassword(password, user.passwordHash);
    } else {
      // Legacy hash format - verify using old method
      const legacyHash = legacyHashPassword(password);
      isValidPassword = user.passwordHash === legacyHash;
      
      // If valid, upgrade to bcrypt hash
      if (isValidPassword) {
        try {
          const newHash = await hashPassword(password);
          await convexClient.mutation(api.mutations.users.update, {
            id: user._id,
            passwordHash: newHash,
          });
          console.log("[LOGIN] Upgraded password hash to bcrypt for user:", email);
        } catch (upgradeError) {
          console.error("[LOGIN] Failed to upgrade password hash:", upgradeError);
          // Continue with login even if upgrade fails
        }
      }
    }
    
    if (!isValidPassword) {
      recordFailedAttempt(email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    clearAttempts(email);

    // Clear any existing session first to avoid conflicts
    await deleteSession();
    
    // Create session
    await createSession(user._id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Prevent caching of auth responses
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
