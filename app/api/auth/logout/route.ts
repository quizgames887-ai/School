import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

// Disable static caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  await deleteSession();
  const response = NextResponse.json({ success: true });
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}
