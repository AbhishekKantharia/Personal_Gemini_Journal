import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initFirebase } from './firebase.js';
import { initGemini } from './gemini.js';
import { createSecretManager } from './secrets.js';
import { verifyFirebaseToken } from './auth.js';
import apiRoutes from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

export async function createApp() {
  const diag = {
    geminiKeyLen: (process.env.GEMINI_API_KEY || '').length,
    fbPrivateKeyLen: (process.env.FIREBASE_PRIVATE_KEY || '').length,
    fbClientEmailLen: (process.env.FIREBASE_CLIENT_EMAIL || '').length,
    fbProjectIdLen: (process.env.FIREBASE_PROJECT_ID || '').length,
  };
  const secretManager = createSecretManager();
  const app = express();

  try {
    initFirebase();
    diag.firebaseReady = true;
  } catch (err) {
    diag.firebaseReady = false;
    diag.firebaseError = String(err.message || err).slice(0, 120);
    console.error('[Firebase] init failed:', err.message);
  }

  const geminiKey = await secretManager.accessSecret('gemini-api-key');
  initGemini(geminiKey);
  diag.geminiReady = !!geminiKey;

  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(cors({
    origin: process.env.CLIENT_URL || true,
    credentials: false,
  }));
  app.use(express.json({ limit: '50kb' }));

  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  });
  app.use('/api/', limiter);

  const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,
    message: { error: 'Chat rate limit exceeded, please wait' },
  });
  app.use('/api/chat', chatLimiter);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), diag });
  });

  app.use('/api', verifyFirebaseToken, apiRoutes);

  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('/*splat', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
    console.log(`[Server] Serving frontend from ${clientDist}`);
  }

  app.use((err, req, res, next) => {
    console.error('[Server] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}