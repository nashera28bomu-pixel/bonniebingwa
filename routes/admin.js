import express from 'express';
import bcrypt from 'bcryptjs';
import Session from '../models/Session.js';
import Contact from '../models/Contact.js';
import { requireSessionAdmin } from '../middleware/auth.js';
import { buildVcf, vcfFilename } from '../config/vcfBuilder.js';

const router = express.Router({ mergeParams: true });

router.use('/:adminToken', requireSessionAdmin);

/**
 * GET /api/admin/:adminToken/dashboard
 * Full dashboard payload: session info + analytics.
 */
router.get('/:adminToken/dashboard', async (req, res) => {
  try {
    const session = req.session;

    const contacts = await Contact.find({ sessionId: session._id }).sort({ createdAt: -1 });

    const countryBreakdown = {};
    let duplicateCount = 0;
    const seenPhones = new Set();

    for (const c of contacts) {
      countryBreakdown[c.countryName || 'Unknown'] = (countryBreakdown[c.countryName || 'Unknown'] || 0) + 1;
      if (seenPhones.has(c.phone)) duplicateCount++;
      seenPhones.add(c.phone);
    }

    res.json({
      session: {
        id: session._id,
        title: session.title,
        description: session.description,
        joinSlug: session.joinSlug,
        joinLink: `/join/${session.joinSlug}`,
        whatsappGroupLink: session.whatsappGroupLink,
        targetCount: session.targetCount,
        emojiPrefix: session.emojiPrefix,
        isActive: session.isActive,
        isPublic: session.isPublic,
        createdAt: session.createdAt,
      },
      stats: {
        totalContacts: contacts.length,
        targetCount: session.targetCount,
        duplicateCount,
        countryBreakdown,
      },
      contacts: contacts.map((c) => ({
        id: c._id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        countryName: c.countryName,
        joinedAt: c.createdAt,
      })),
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

/**
 * PATCH /api/admin/:adminToken/settings
 * Update whatsappGroupLink, targetCount, emojiPrefix, isActive, isPublic.
 */
router.patch('/:adminToken/settings', async (req, res) => {
  try {
    const { whatsappGroupLink, targetCount, emojiPrefix, isActive, isPublic, title, description } = req.body;
    const session = req.session;

    if (whatsappGroupLink !== undefined) session.whatsappGroupLink = whatsappGroupLink;
    if (targetCount !== undefined) session.targetCount = targetCount;
    if (emojiPrefix !== undefined) session.emojiPrefix = emojiPrefix;
    if (isActive !== undefined) session.isActive = isActive;
    if (isPublic !== undefined) session.isPublic = isPublic;
    if (title !== undefined) session.title = title;
    if (description !== undefined) session.description = description;

    await session.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * DELETE /api/admin/:adminToken/duplicates
 * Removes duplicate contacts (same phone number) within this session,
 * keeping the earliest entry for each phone.
 */
router.delete('/:adminToken/duplicates', async (req, res) => {
  try {
    const session = req.session;
    const contacts = await Contact.find({ sessionId: session._id }).sort({ createdAt: 1 });

    const seen = new Set();
    const toDelete = [];

    for (const c of contacts) {
      if (seen.has(c.phone)) {
        toDelete.push(c._id);
      } else {
        seen.add(c.phone);
      }
    }

    if (toDelete.length > 0) {
      await Contact.deleteMany({ _id: { $in: toDelete } });
      session.contactCount = Math.max(0, session.contactCount - toDelete.length);
      await session.save();
    }

    res.json({ success: true, removed: toDelete.length });
  } catch (err) {
    console.error('Delete duplicates error:', err);
    res.status(500).json({ error: 'Failed to remove duplicates' });
  }
});

/**
 * DELETE /api/admin/:adminToken/contacts/:contactId
 * Remove a single contact manually.
 */
router.delete('/:adminToken/contacts/:contactId', async (req, res) => {
  try {
    const session = req.session;
    const result = await Contact.deleteOne({ _id: req.params.contactId, sessionId: session._id });

    if (result.deletedCount > 0) {
      session.contactCount = Math.max(0, session.contactCount - 1);
      await session.save();
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete contact error:', err);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

/**
 * GET /api/admin/:adminToken/export
 * Generates and downloads the .vcf file for this session, with emoji prefix applied.
 */
router.get('/:adminToken/export', async (req, res) => {
  try {
    const session = req.session;
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
    console.error('Export VCF error:', err);
    res.status(500).json({ error: 'Failed to export VCF' });
  }
});

export default router;
