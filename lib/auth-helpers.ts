import { getSession } from "./session";

export async function getCurrentUser() {
  return await getSession();
}

export async function getCurrentUserRole() {
  const user = await getCurrentUser();
  return user?.role || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user.userId;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Admin access required");
  }
  return user.role;
}
