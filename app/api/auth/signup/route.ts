import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { createSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";

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
    // #region agent log
    const requestText = await request.clone().text();
    fetch('http://127.0.0.1:7244/ingest/42a76cd6-c3b4-41d8-a6da-d645a23f4e18',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/signup/route.ts:17',message:'Before parsing request JSON',data:{requestText,textLength:requestText.length,contentType:request.headers.get('content-type')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await convexClient.query(api.queries.users.getByEmail, {
      email,
    });

    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = hashPassword(password);
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
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/42a76cd6-c3b4-41d8-a6da-d645a23f4e18',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/signup/route.ts:59',message:'Returning success response',data:{status:response.status,hasBody:!!response.body},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    return response;
  } catch (error: any) {
    console.error("Signup error:", error);
    const errorResponse = NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/42a76cd6-c3b4-41d8-a6da-d645a23f4e18',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/signup/route.ts:69',message:'Returning error response',data:{status:errorResponse.status,errorMessage:error?.message,hasBody:!!errorResponse.body},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    return errorResponse;
  }
}
