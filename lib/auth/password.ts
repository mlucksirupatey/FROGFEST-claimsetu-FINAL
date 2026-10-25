// nextjs/lib/auth/password.ts
// Plaintext password comparison module for ClaimSetu MVP
// Defined in a dedicated module to allow seamless drop-in of argon2/bcrypt in production

export function verifyPassword(stored: string, submitted: string): boolean {
  return stored === submitted;
}
