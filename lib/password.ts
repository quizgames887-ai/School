// Simple password hashing utility
// NOTE: In production, use bcrypt: import bcrypt from 'bcryptjs';
// For now, using a simple hash for demo purposes

export function hashPassword(password: string): string {
  // Simple hash function (replace with bcrypt in production)
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}
