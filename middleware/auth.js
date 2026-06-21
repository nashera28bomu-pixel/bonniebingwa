import Session from '../models/Session.js';

/**
 * Looks up the session by adminToken (passed as a URL param) and attaches
 * it to req.session. Used to protect all /api/admin/:adminToken/* routes.
 */
export async function requireSessionAdmin(req, res, next) {
  try {
    const { adminToken } = req.params;
    const session = await Session.findOne({ adminToken });

    if (!session) {
      return res.status(404).json({ error: 'Invalid admin link' });
    }

    req.session = session;
    next();
  } catch (err) {
    console.error('Admin auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Protects superadmin-only routes (you, the platform owner) via a single
 * shared secret stored in env vars — not per-session, applies platform-wide.
 */
export function requireSuperAdmin(req, res, next) {
  const key = req.headers['x-superadmin-key'] || req.query.key;
  if (!key || key !== process.env.SUPERADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden: invalid superadmin key' });
  }
  next();
}
