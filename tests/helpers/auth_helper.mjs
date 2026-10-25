// nextjs/tests/helpers/auth_helper.mjs
// Test helper to generate valid NextAuth v5 session cookies for API tests

import { encode } from 'next-auth/jwt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env.local') });

export async function getAuthCookie(user = { userId: '2', email: 'aarav.sharma@nepalmail.np', role: 'policyholder' }) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not defined in .env.local');
  }
  const token = {
    userId: String(user.userId),
    email: user.email,
    role: user.role,
  };
  const sessionToken = await encode({
    token,
    secret,
    salt: 'authjs.session-token',
  });
  return `authjs.session-token=${sessionToken}`;
}
