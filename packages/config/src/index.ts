import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

dotenvConfig();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Storage (S3/MinIO)
  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_ACCESS_KEY: z.string().min(1),
  STORAGE_SECRET_KEY: z.string().min(1),
  STORAGE_BUCKET: z.string().default('cronus-assets'),
  STORAGE_REGION: z.string().default('us-east-1'),

  // Temporal
  TEMPORAL_ADDRESS: z.string().default('localhost:7233'),
  TEMPORAL_NAMESPACE: z.string().default('default'),

  // AI
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),

  // API
  API_PORT: z.coerce.number().default(3000),
  API_HOST: z.string().default('0.0.0.0'),
  API_KEY: z.string().min(1), // allow-secret

  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

let cachedConfig: Env | null = null;

export function getConfig(): Env {
  if (cachedConfig) return cachedConfig;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Environment validation failed:\n${missing.join('\n')}`);
  }
  cachedConfig = result.data;
  return cachedConfig;
}

export function getConfigSafe(): Partial<Env> {
  return envSchema.partial().parse(process.env);
}
