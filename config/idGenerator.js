import crypto from 'crypto';

/** Short, URL-friendly random slug for join links, e.g. "x7k2pq" */
export function generateSlug(length = 7) {
  return crypto.randomBytes(8).toString('base64url').slice(0, length).toLowerCase();
}

/** Longer random token for admin dashboard access */
export function generateAdminToken() {
  return crypto.randomBytes(24).toString('base64url');
}
