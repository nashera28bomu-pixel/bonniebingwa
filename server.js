import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';

import packagesRoutes from './routes/packagesRoutes.js';
import paymentsRoutes from './routes/paymentsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import adminPackagesRoutes from './routes/adminPackagesRoutes.js';
import adminDashboardRoutes from './routes/adminDashboardRoutes.js';
import adminSettingsRoutes from './routes/adminSettingsRoutes.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Basic rate limiting on purchase + login endpoints to deter abuse
const purchaseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please slow down.' }
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.' }
});

app.use('/api/payments/purchase', purchaseLimiter);
app.use('/api/admin/auth/login', loginLimiter);

// Public routes
app.use('/api/packages', packagesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/settings', settingsRoutes);

// Admin routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/packages', adminPackagesRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', demoMode: process.env.DEMO_MODE === 'true' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Bonnie Bingwa backend running on port ${PORT}`);
    console.log(`   DEMO_MODE: ${process.env.DEMO_MODE}`);
  });
});
