// Vercel serverless entry point.
// All requests under /api/* are routed here by Vercel's filesystem routing.
// We hand the request off to the same Express app used in dev.

import { buildApp } from '../server/src/app.js';

const app = buildApp();

export default app;

// Vercel config: extend the function timeout if needed (default 10s).
export const config = {
  api: {
    bodyParser: false, // let Express's json() middleware handle parsing
  },
};
