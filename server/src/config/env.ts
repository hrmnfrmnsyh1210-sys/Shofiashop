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

  // ---- RajaOngkir (online-order shipping cost) ----
  // Leave RAJAONGKIR_API_KEY empty to disable the shipping API.
  RAJAONGKIR_API_KEY: z.string().default(''),
  RAJAONGKIR_BASE_URL: z.string().default('https://api.rajaongkir.com/starter'),
  // Colon-separated couriers to quote, e.g. "jne:pos:tiki" (Starter plan limit).
  RAJAONGKIR_COURIERS: z.string().default('jne:pos:tiki'),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
