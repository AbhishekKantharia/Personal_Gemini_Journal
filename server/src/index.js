import 'dotenv/config';
import { createApp } from './app.js';

async function start() {
  const PORT = process.env.PORT || 3001;
  const app = await createApp();

  app.listen(PORT, () => {
    console.log(`[Server] Gemini Journal API running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});