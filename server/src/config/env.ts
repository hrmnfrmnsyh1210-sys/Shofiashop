import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (TiDB Cloud MySQL URL)'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

  // ---- Komerce Collaborator platform (RajaOngkir x Komship) ----
  // Single host for all shipping services; switch sandbox <-> production here.
  //   sandbox:    https://api-sandbox.collaborator.komerce.id
  //   production: https://api.collaborator.komerce.id
  KOMERCE_BASE_URL: z.string().default('https://api-sandbox.collaborator.komerce.id'),
  // "Shipping Cost" key — powers ongkir calculation + destination search
  // (tariff API). Leave empty to disable the ongkir feature.
  KOMERCE_COST_API_KEY: z.string().default(''),
  // "Shipping Delivery" key (Komship) — powers auto-resi (order/pickup) and AWB
  // tracking. Separate key from the cost key. Leave empty to keep manual resi.
  KOMSHIP_API_KEY: z.string().default(''),
  // Default pickup vehicle (Motor | Mobil | Truk) and pickup time (HH:MM).
  KOMSHIP_PICKUP_VEHICLE: z.string().default('Motor'),
  KOMSHIP_PICKUP_TIME: z.string().default('13:00'),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
