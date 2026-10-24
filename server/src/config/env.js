import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().optional(),

  // Individual Aiven PostgreSQL credentials (optional alternative to DATABASE_URL)
  AIVEN_PG_HOST: z.string().optional(),
  AIVEN_PG_PORT: z.coerce.number().default(5432),
  AIVEN_PG_USER: z.string().default('avnadmin'),
  AIVEN_PG_PASSWORD: z.string().optional(),
  AIVEN_PG_DATABASE: z.string().default('defaultdb'),
  AIVEN_PG_SSLMODE: z.string().default('require'),

  JWT_ACCESS_SECRET: z
    .string()
    .min(16)
    .default('super_secret_access_token_key_change_in_production_min_32_chars'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16)
    .default('super_secret_refresh_token_key_change_in_production_min_32_chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RAZORPAY_KEY_ID: z.string().default('rzp_test_1DP5mmOlF5G5ag'),
  RAZORPAY_KEY_SECRET: z.string().default('s9x1W8oH8vQ2wM3L4k5J6i7H'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('test_webhook_secret_key'),
  ENABLE_RETENTION_JOB: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .default(false),
  RETENTION_DAYS: z.coerce.number().default(90),
  INTERNAL_API_KEY: z.string().default('random_characters'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

// Compute active DATABASE_URL from individual Aiven fields if DATABASE_URL is not set or placeholder
let computedDbUrl = parsed.data.DATABASE_URL;
if (
  (!computedDbUrl || computedDbUrl.includes('PASTE_YOUR_') || computedDbUrl.trim() === '') &&
  parsed.data.AIVEN_PG_HOST &&
  parsed.data.AIVEN_PG_PASSWORD
) {
  const encPass = encodeURIComponent(parsed.data.AIVEN_PG_PASSWORD);
  computedDbUrl = `postgres://${parsed.data.AIVEN_PG_USER}:${encPass}@${parsed.data.AIVEN_PG_HOST}:${parsed.data.AIVEN_PG_PORT}/${parsed.data.AIVEN_PG_DATABASE}?sslmode=${parsed.data.AIVEN_PG_SSLMODE}`;
}

if (!computedDbUrl) {
  computedDbUrl = 'postgresql://postgres:postgres@localhost:5432/ecommerce_db';
}

export const env = {
  ...parsed.data,
  DATABASE_URL: computedDbUrl,
};
