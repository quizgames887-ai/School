import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { createSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";

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

// Password strength requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Optional: set to true for stricter security
};

function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }
  
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return { valid: errors.length === 0, errors };
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeName(name: string): string {
  // Remove any potentially dangerous characters
  return name.replace(/[<>]/g, "").trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Trim and normalize inputs
    const email = body.email?.trim()?.toLowerCase();
    const password = body.password?.trim();
    const name = sanitizeName(body.name || "");

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Name must be between 2 and 100 characters" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(". ") },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await convexClient.query(api.queries.users.getByEmail, {
      email,
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password using bcrypt (async)
    const passwordHash = await hashPassword(password);
    
    // Create user
    const userId = await convexClient.mutation(api.mutations.users.create, {
      email,
      name,
      passwordHash,
      role: "teacher", // Default role for new sign-ups
    });

    // Create session
    await createSession(userId);

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name,
        role: "teacher",
      },
    });

    // Prevent caching of auth responses
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error: any) {
    console.error("Signup error:", error);
    
    // Don't expose internal errors to users
    const userMessage = error.message?.includes("already exists")
      ? "An account with this email already exists"
      : "An error occurred during registration. Please try again.";
    
    return NextResponse.json(
      { error: userMessage },
      { status: error.message?.includes("already exists") ? 409 : 500 }
    );
  }
}
