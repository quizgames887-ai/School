import bcrypt from "bcryptjs";

// Number of salt rounds for bcrypt (higher = more secure but slower)
// 10-12 is recommended for production
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Synchronous hash function (for compatibility during migration)
 * @deprecated Use hashPassword instead
 */
export function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

/**
 * Synchronous verify function (for compatibility during migration)
 * @deprecated Use verifyPassword instead
 */
export function verifyPasswordSync(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
