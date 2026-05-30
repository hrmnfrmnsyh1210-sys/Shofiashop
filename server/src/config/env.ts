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

  // ---- RajaOngkir V2 (Komerce) — ongkir + waybill tracking ----
  // Host rajaongkir.komerce.id, auth header `key`. Powers cost calculation,
  // destination search, and AWB tracking. Empty key = ongkir disabled.
  RAJAONGKIR_API_KEY: z.string().default(''),
  RAJAONGKIR_BASE_URL: z.string().default('https://rajaongkir.komerce.id/api/v1'),
  // Couriers to quote, colon-separated (Komerce returns all in one call).
  RAJAONGKIR_COURIERS: z.string().default('jne:jnt:sicepat:anteraja:pos:tiki:ninja'),

  // ---- Komship Delivery Order API (collaborator) — auto-generate resi ----
  // Separate platform & key (header `x-api-key`). Sandbox by default; switch to
  // https://api.collaborator.komerce.id/order/api/v1 for production. Requires
  // the "Shipping Delivery" key; empty = manual resi entry only.
  KOMSHIP_BASE_URL: z
    .string()
    .default('https://api-sandbox.collaborator.komerce.id/order/api/v1'),
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
