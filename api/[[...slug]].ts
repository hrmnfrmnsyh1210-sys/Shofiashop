// Vercel serverless entry point.
// Vercel's filesystem routing forwards every request under /api/* to this file.
// We delegate to the same Express app used in dev.

import { buildApp } from '../server/src/app.js';

const app = buildApp();

export default app;
