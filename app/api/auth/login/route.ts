import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { createSession, deleteSession } from "@/lib/session";
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Trim email and password to handle whitespace issues
    const email = body.email?.trim();
    const password = body.password?.trim();

    console.log("[LOGIN] Attempt for email:", email);

    if (!email || !password) {
      console.log("[LOGIN] Missing email or password");
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    console.log("[LOGIN] Querying user by email...");
    const user = await convexClient.query(api.queries.users.getByEmail, {
      email,
    });

    console.log("[LOGIN] User found:", user ? { id: user._id, email: user.email, hasPasswordHash: !!user.passwordHash } : null);

    if (!user) {
      console.log("[LOGIN] No user found for email:", email);
      return NextResponse.json(
        { error: `User not found with email: ${email}` },
        { status: 401 }
      );
    }

    // Verify password
    const passwordHash = hashPassword(password);
    
    console.log("[LOGIN] Password verification:", {
      inputPasswordLength: password.length,
      computedHashLength: passwordHash.length,
      storedHashLength: user.passwordHash?.length,
      hashesMatch: user.passwordHash === passwordHash,
      computedHash: passwordHash,
      storedHash: user.passwordHash,
    });
    
    if (user.passwordHash !== passwordHash) {
      console.log("[LOGIN] Password mismatch for user:", email);
      console.log("[LOGIN] Stored hash:", user.passwordHash);
      console.log("[LOGIN] Computed hash:", passwordHash);
      console.log("[LOGIN] Password bytes:", Array.from(password).map(c => c.charCodeAt(0)));
      return NextResponse.json(
        { error: `Password mismatch. Stored: "${user.passwordHash}" (len ${user.passwordHash?.length}), Computed: "${passwordHash}" (len ${passwordHash.length})` },
        { status: 401 }
      );
    }
    
    console.log("[LOGIN] Password verified successfully for user:", email);

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
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
