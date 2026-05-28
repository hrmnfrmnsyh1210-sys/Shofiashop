// Vercel serverless entry point.
// All requests under /api/* are rewritten to this file by vercel.json.
// We delegate to the same Express app used in dev.

import { buildApp } from '../server/src/app.js';

const app = buildApp();

export default app;
