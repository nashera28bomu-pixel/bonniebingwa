import express from 'express';
import bcrypt from 'bcryptjs';
import Session from '../models/Session.js';
import Contact from '../models/Contact.js';
import { generateSlug, generateAdminToken } from '../config/idGenerator.js';

const router = express.Router();

/**
 * POST /api/sessions
 * Create a new VCF session.
 * body: { title, description, ownerPhone, ownerPin, whatsappGroupLink, targetCount, isPublic }
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, ownerPhone, ownerPin, whatsappGroupLink, targetCount, isPublic } = req.body;

    if (!title || !ownerPhone || !ownerPin) {
      return res.status(400).json({ error: 'title, ownerPhone and ownerPin are required' });
    }
    if (String(ownerPin).length < 4) {
      return res.status(400).json({ error: 'PIN must be at least 4 digits' });
    }

    let joinSlug = generateSlug();
    // Extremely unlikely collision, but check anyway
    while (await Session.findOne({ joinSlug })) {
      joinSlug = generateSlug();
    }

    const hashedPin = await bcrypt.hash(String(ownerPin), 10);
    const adminToken = generateAdminToken();

    const session = await Session.create({
      title,
      description: description || '',
      ownerPhone,
      ownerPin: hashedPin,
      adminToken,
      joinSlug,
      whatsappGroupLink: whatsappGroupLink || '',
      targetCount: targetCount || 0,
      isPublic: isPublic !== false,
    });

    res.status(201).json({
      sessionId: session._id,
      joinSlug: session.joinSlug,
      joinLink: `/join/${session.joinSlug}`,
      adminToken: session.adminToken,
      adminLink: `/admin/${session.adminToken}`,
    });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * GET /api/sessions/public
 * List active public sessions for the homepage feed.
 */
router.get('/public', async (req, res) => {
  try {
    const sessions = await Session.find({ isActive: true, isPublic: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('title description joinSlug targetCount contactCount createdAt');

    res.json(sessions);
  } catch (err) {
    console.error('List public sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * GET /api/sessions/join/:slug
 * Public info needed to render the join page (no sensitive data).
 */
router.get('/join/:slug', async (req, res) => {
  try {
    const session = await Session.findOne({ joinSlug: req.params.slug, isActive: true })
      .select('title description targetCount contactCount whatsappGroupLink');

    if (!session) {
      return res.status(404).json({ error: 'Session not found or no longer active' });
    }
    res.json(session);
  } catch (err) {
    console.error('Get join session error:', err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

export default router;
