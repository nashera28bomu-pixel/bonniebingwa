import express from 'express';
import Session from '../models/Session.js';
import Contact from '../models/Contact.js';
import { normalizePhone, resolveCountry } from '../config/phoneUtils.js';

const router = express.Router();

/**
 * POST /api/join/:slug
 * Public endpoint — a person fills in name/phone/email and joins a session.
 * Emits a socket.io event so the admin dashboard updates in real time.
 */
router.post('/:slug', async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone number are required' });
    }

    const session = await Session.findOne({ joinSlug: req.params.slug, isActive: true });
    if (!session) {
      return res.status(404).json({ error: 'Session not found or no longer active' });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!/^\+\d{8,15}$/.test(normalizedPhone)) {
      return res.status(400).json({ error: 'Please enter a valid phone number' });
    }

    const { name: countryName, flag } = resolveCountry(normalizedPhone);

    // Check for duplicate within this session
    const existing = await Contact.findOne({ sessionId: session._id, phone: normalizedPhone });
    if (existing) {
      // Don't hard-block — still send them to the WhatsApp group, just don't double count
      return res.status(200).json({
        alreadyJoined: true,
        whatsappGroupLink: session.whatsappGroupLink,
        message: 'You already joined this session.',
      });
    }

    const contact = await Contact.create({
      sessionId: session._id,
      name: name.trim(),
      phone: normalizedPhone,
      email: (email || '').trim(),
      countryCode: resolveCountry(normalizedPhone).code,
      countryName,
    });

    session.contactCount += 1;
    await session.save();

    // Real-time push to the admin dashboard, if socket.io is attached
    const io = req.app.get('io');
    if (io) {
      io.to(`session:${session._id}`).emit('newJoin', {
        name: contact.name,
        countryName,
        flag,
        contactCount: session.contactCount,
        targetCount: session.targetCount,
        joinedAt: contact.createdAt,
      });
    }

    res.status(201).json({
      success: true,
      whatsappGroupLink: session.whatsappGroupLink,
      message: 'You are in! Head to the WhatsApp group to await the file.',
    });
  } catch (err) {
    console.error('Join session error:', err);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

export default router;
