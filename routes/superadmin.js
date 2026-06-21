import express from 'express';
import Session from '../models/Session.js';
import Contact from '../models/Contact.js';
import { requireSuperAdmin } from '../middleware/auth.js';
import { buildVcf, vcfFilename } from '../config/vcfBuilder.js';

const router = express.Router();

router.use(requireSuperAdmin);

/**
 * GET /api/super/sessions
 * Lists every session ever created on the platform, active or not.
 */
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find()
      .sort({ createdAt: -1 })
      .select('title description joinSlug adminToken ownerPhone contactCount targetCount isActive isPublic createdAt');

    res.json(sessions);
  } catch (err) {
    console.error('Superadmin list sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * GET /api/super/export/:sessionId
 * Download the VCF for any single session, regardless of owner.
 */
router.get('/export/:sessionId', async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const contacts = await Contact.find({ sessionId: session._id }).sort({ createdAt: 1 });
    if (contacts.length === 0) {
      return res.status(400).json({ error: 'No contacts to export yet' });
    }

    const vcfContent = buildVcf(contacts, session.emojiPrefix);
    const filename = vcfFilename(session.title);

    res.setHeader('Content-Type', 'text/vcard');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(vcfContent);
  } catch (err) {
    console.error('Superadmin export error:', err);
    res.status(500).json({ error: 'Failed to export VCF' });
  }
});

/**
 * GET /api/super/export-all
 * Download every session's contacts combined into one master VCF.
 */
router.get('/export-all', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: 1 });
    if (contacts.length === 0) {
      return res.status(400).json({ error: 'No contacts on the platform yet' });
    }

    const vcfContent = buildVcf(contacts, '');
    res.setHeader('Content-Type', 'text/vcard');
    res.setHeader('Content-Disposition', `attachment; filename="cymorvcf-all-${Date.now()}.vcf"`);
    res.send(vcfContent);
  } catch (err) {
    console.error('Superadmin export-all error:', err);
    res.status(500).json({ error: 'Failed to export all contacts' });
  }
});

/**
 * PATCH /api/super/sessions/:sessionId
 * Force-toggle a session's active/public status (moderation power).
 */
router.patch('/sessions/:sessionId', async (req, res) => {
  try {
    const { isActive, isPublic } = req.body;
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (isActive !== undefined) session.isActive = isActive;
    if (isPublic !== undefined) session.isPublic = isPublic;
    await session.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Superadmin update session error:', err);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

export default router;
