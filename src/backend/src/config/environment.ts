/**
 * Environment Configuration
 * Sistema de Monitoramento de Temperatura
 * Subagente: Backend Developer (Node.js, Express, TypeScript)
 */

import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections: number;
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  ttl: number;
}

interface OpenWeatherConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  rateLimitMax: number;
  corsOrigin: string | string[];
}

interface AlertConfig {
  emailFrom: string;
  emailHost: string;
  emailPort: number;
  emailUser?: string;
  emailPass?: string;
  webhookTimeout: number;
  webhookRetryAttempts: number;
}

interface AppConfig {
  nodeEnv: string;
  port: number;
  apiVersion: string;
  healthCheckInterval: number;
  metricsEnabled: boolean;
  database: DatabaseConfig;
  redis: RedisConfig;
  openWeather: OpenWeatherConfig;
  security: SecurityConfig;
  alerts: AlertConfig;
}

const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT', 
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'REDIS_HOST',
  'REDIS_PORT',
  'OPENWEATHER_API_KEY',
  'JWT_SECRET'
];

// Validate required environment variables
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  apiVersion: process.env.API_VERSION || 'v1',
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
  metricsEnabled: process.env.METRICS_ENABLED === 'true',

  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    database: process.env.DB_NAME!,
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20')
  },

  redis: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT!),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    ttl: parseInt(process.env.CACHE_TTL || '300') // 5 minutes
  },

  openWeather: {
    apiKey: process.env.OPENWEATHER_API_KEY!,
    baseUrl: process.env.OPENWEATHER_BASE_URL || 'http://api.openweathermap.org/data/2.5',
    timeout: parseInt(process.env.OPENWEATHER_TIMEOUT || '10000')
  },

  security: {
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    rateLimitMax: parseInt(process.env.API_RATE_LIMIT || '100'),
    corsOrigin: process.env.CORS_ORIGIN || ['http://localhost:3001', 'http://localhost:5173']
  },

  alerts: {
    emailFrom: process.env.ALERT_EMAIL_FROM || 'noreply@temperatura.dev',
    emailHost: process.env.ALERT_EMAIL_HOST || 'smtp.gmail.com',
    emailPort: parseInt(process.env.ALERT_EMAIL_PORT || '587'),
    emailUser: process.env.ALERT_EMAIL_USER,
    emailPass: process.env.ALERT_EMAIL_PASS,
    webhookTimeout: parseInt(process.env.ALERT_WEBHOOK_TIMEOUT || '5000'),
    webhookRetryAttempts: parseInt(process.env.ALERT_WEBHOOK_RETRY_ATTEMPTS || '3')
  }
};

// Log configuration (excluding sensitive data)
const configForLogging = {
  ...config,
  database: {
    ...config.database,
    password: '[REDACTED]'
  },
  redis: {
    ...config.redis,
    password: config.redis.password ? '[REDACTED]' : undefined
  },
  openWeather: {
    ...config.openWeather,
    apiKey: '[REDACTED]'
  },
  security: {
    ...config.security,
    jwtSecret: '[REDACTED]'
  },
  alerts: {
    ...config.alerts,
    emailPass: config.alerts.emailPass ? '[REDACTED]' : undefined
  }
};

logger.info('Configuration loaded', { config: configForLogging });

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';
