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

export async function createSession(userId: Id<"users">) {
  const cookieStore = await cookies();
  
  // Generate a simple session token (in production, use a more secure method)
  const sessionToken = crypto.randomUUID();
  
  // Set cookies
  cookieStore.set("userId", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  
  cookieStore.set("sessionToken", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const sessionToken = cookieStore.get("sessionToken")?.value;

  if (!userId || !sessionToken) {
    return null;
  }

  try {
    // Fetch user data from Convex
    const user = await convexClient.query(api.queries.users.getById, {
      id: userId as Id<"users">,
    });

    if (!user) {
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

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("userId");
  cookieStore.delete("sessionToken");
}
