import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import { setupSocket } from './config/socket.js';

import sessionsRoutes from './routes/sessions.js';
import joinRoutes from './routes/join.js';
import adminRoutes from './routes/admin.js';
import superadminRoutes from './routes/superadmin.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

app.set('io', io);
setupSocket(io);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API routes
app.use('/api/sessions', sessionsRoutes);
app.use('/api/join', joinRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super', superadminRoutes);

// Health check (handy for Render)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Frontend page routes (serve the SPA-ish static pages)
app.get('/', (req, res) => res.sendFile('index.html', { root: 'public' }));
app.get('/join/:slug', (req, res) => res.sendFile('join.html', { root: 'public' }));
app.get('/admin/:adminToken', (req, res) => res.sendFile('admin.html', { root: 'public' }));
app.get('/super', (req, res) => res.sendFile('super.html', { root: 'public' }));

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 CymorVCF running on port ${PORT}`);
  });
});
