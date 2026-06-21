import express from 'express';
import SiteSettings from '../models/SiteSettings.js';
import { requireAdminAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAdminAuth);

// GET /api/admin/settings
router.get('/', async (req, res) => {
  const settings = await SiteSettings.getSettings();
  res.json(settings);
});

// PUT /api/admin/settings - update contact, flash sale, or homepage config
// Accepts partial updates, e.g. { contact: {...} } or { flashSale: {...} }
router.put('/', async (req, res) => {
  try {
    const settings = await SiteSettings.getSettings();

    if (req.body.contact) {
      settings.contact = { ...settings.contact.toObject(), ...req.body.contact };
    }
    if (req.body.flashSale) {
      settings.flashSale = { ...settings.flashSale.toObject(), ...req.body.flashSale };
    }
    if (req.body.homepage) {
      settings.homepage = { ...settings.homepage.toObject(), ...req.body.homepage };
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error('update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
