/**
 * Redis Service
 * Sistema de Monitoramento de Temperatura
 * Subagente: Backend Developer (Node.js, Express, TypeScript)
 */

import Redis, { RedisOptions } from 'ioredis';
import { config } from '../config/environment';
import { logger, logError } from '../utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  serialize?: boolean; // Whether to JSON serialize/deserialize
}

export class RedisService {
  private client: Redis;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    const redisOptions: RedisOptions = {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4, // IPv4
      connectTimeout: 10000,
      commandTimeout: 5000,
    };

    this.client = new Redis(redisOptions);

    this.setupEventHandlers();
  }

  /**
   * Setup Redis event handlers
   */
  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.debug('Redis client connected');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('Redis client ready for commands', {
        host: config.redis.host,
        port: config.redis.port,
        db: config.redis.db
      });
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logError(new Error('Redis client error'), {
        error: error.message,
        reconnectAttempts: this.reconnectAttempts
      });
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      this.reconnectAttempts++;
      logger.info('Redis client reconnecting', {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('Maximum Redis reconnection attempts reached');
        this.client.disconnect();
      }
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.info('Redis connection ended');
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect();
      
      // Test connection
      const pong = await this.client.ping();
      if (pong !== 'PONG') {
        throw new Error('Redis ping test failed');
      }

      logger.info('Redis service connected successfully');
    } catch (error) {
      this.isConnected = false;
      logError(new Error('Failed to connect to Redis'), {
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis service disconnected successfully');
    } catch (error) {
      logError(new Error('Error disconnecting from Redis'), {
        error: (error as Error).message
      });
      await this.client.disconnect();
    }
  }

  /**
   * Check if Redis is connected
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Get Redis client info
   */
  async getInfo(): Promise<{ [key: string]: string }> {
    try {
      const info = await this.client.info();
      const lines = info.split('\r\n');
      const result: { [key: string]: string } = {};

      lines.forEach(line => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            result[key] = value;
          }
        }
      });

      return result;
    } catch (error) {
      logError(new Error('Failed to get Redis info'), {
        error: (error as Error).message
      });
      throw error;
    }
  }

  // ============================================================================
  // CACHE OPERATIONS
  // ============================================================================

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, optionsOrTtl: CacheOptions | number = {}): Promise<void> {
    try {
      // Handle both CacheOptions and direct TTL number
      const options: CacheOptions = typeof optionsOrTtl === 'number' 
        ? { ttl: optionsOrTtl, serialize: true }
        : optionsOrTtl;

      const { ttl = config.redis.ttl, serialize = true } = options;
      const serializedValue = serialize ? JSON.stringify(value) : value;

      if (ttl > 0) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }

      logger.debug('Cache SET operation', { key, ttl, hasValue: !!value });
    } catch (error) {
      logError(new Error('Cache SET operation failed'), {
        key,
        error: (error as Error).message
      });
      // Don't throw - cache failures shouldn't break the app
    }
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const { serialize = true } = options;
      const value = await this.client.get(key);

      if (value === null) {
        logger.debug('Cache MISS', { key });
        return null;
      }

      logger.debug('Cache HIT', { key });
      return serialize ? JSON.parse(value) : (value as T);
    } catch (error) {
      logError(new Error('Cache GET operation failed'), {
        key,
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      const result = await this.client.del(key);
      logger.debug('Cache DELETE operation', { key, deleted: result > 0 });
    } catch (error) {
      logError(new Error('Cache DELETE operation failed'), {
        key,
        error: (error as Error).message
      });
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logError(new Error('Cache EXISTS operation failed'), {
        key,
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Set expiration for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logError(new Error('Cache EXPIRE operation failed'), {
        key,
        seconds,
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async getTTL(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logError(new Error('Cache TTL operation failed'), {
        key,
        error: (error as Error).message
      });
      return -2; // Key doesn't exist
    }
  }

  /**
   * Delete keys by pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.client.del(...keys);
      logger.debug('Cache DELETE_BY_PATTERN operation', {
        pattern,
        keysFound: keys.length,
        deleted: result
      });

      return result;
    } catch (error) {
      logError(new Error('Cache DELETE_BY_PATTERN operation failed'), {
        pattern,
        error: (error as Error).message
      });
      return 0;
    }
  }

  // ============================================================================
  // SPECIALIZED CACHE OPERATIONS FOR WEATHER DATA
  // ============================================================================

  /**
   * Cache temperature data for a city
   */
  async cacheTemperatureData(cidadeId: number, data: any, ttl?: number): Promise<void> {
    const key = `temperature:city:${cidadeId}`;
    await this.set(key, data, { ttl: ttl || config.redis.ttl });
  }

  /**
   * Get cached temperature data for a city
   */
  async getCachedTemperatureData<T = any>(cidadeId: number): Promise<T | null> {
    const key = `temperature:city:${cidadeId}`;
    return await this.get<T>(key);
  }

  /**
   * Cache OpenWeather API response
   */
  async cacheOpenWeatherResponse(cidadeId: number, data: any, ttl: number = 600): Promise<void> {
    const key = `openweather:${cidadeId}`;
    await this.set(key, data, { ttl });
  }

  /**
   * Get cached OpenWeather API response
   */
  async getCachedOpenWeatherResponse<T = any>(cidadeId: number): Promise<T | null> {
    const key = `openweather:${cidadeId}`;
    return await this.get<T>(key);
  }

  /**
   * Cache cities list
   */
  async cacheCitiesList(cities: any[], ttl: number = 3600): Promise<void> {
    const key = 'cities:list';
    await this.set(key, cities, { ttl });
  }

  /**
   * Get cached cities list
   */
  async getCachedCitiesList<T = any>(): Promise<T[] | null> {
    const key = 'cities:list';
    return await this.get<T[]>(key);
  }

  /**
   * Cache API rate limit data
   */
  async cacheRateLimitData(key: string, requests: number, ttl: number): Promise<void> {
    const rateLimitKey = `ratelimit:${key}`;
    await this.set(rateLimitKey, { requests, resetTime: Date.now() + (ttl * 1000) }, { ttl });
  }

  /**
   * Get cached rate limit data
   */
  async getRateLimitData(key: string): Promise<{ requests: number; resetTime: number } | null> {
    const rateLimitKey = `ratelimit:${key}`;
    return await this.get<{ requests: number; resetTime: number }>(rateLimitKey);
  }

  /**
   * Cache alert configurations
   */
  async cacheAlertConfigs(cidadeId: number, configs: any[], ttl: number = 1800): Promise<void> {
    const key = `alerts:config:${cidadeId}`;
    await this.set(key, configs, { ttl });
  }

  /**
   * Get cached alert configurations
   */
  async getCachedAlertConfigs<T = any>(cidadeId: number): Promise<T[] | null> {
    const key = `alerts:config:${cidadeId}`;
    return await this.get<T[]>(key);
  }

  /**
   * Invalidate cache for a city (clear all related data)
   */
  async invalidateCityCache(cidadeId: number): Promise<void> {
    const patterns = [
      `temperature:city:${cidadeId}`,
      `openweather:${cidadeId}`,
      `alerts:config:${cidadeId}`
    ];

    for (const pattern of patterns) {
      await this.delete(pattern);
    }

    logger.debug('Cache invalidated for city', { cidadeId });
  }

  /**
   * Clear all cache
   */
  async flushAll(): Promise<void> {
    try {
      await this.client.flushdb();
      logger.info('All cache cleared');
    } catch (error) {
      logError(new Error('Failed to flush cache'), {
        error: (error as Error).message
      });
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsed: string;
    hitRate?: string;
  }> {
    try {
      const info = await this.getInfo();
      const dbSize = await this.client.dbsize();

      return {
        totalKeys: dbSize,
        memoryUsed: info.used_memory_human || '0B',
        hitRate: info.keyspace_hit_rate
      };
    } catch (error) {
      logError(new Error('Failed to get cache statistics'), {
        error: (error as Error).message
      });
      
      return {
        totalKeys: 0,
        memoryUsed: '0B'
      };
    }
  }

  /**
   * Delete a key (alias for delete method)
   */
  async del(key: string): Promise<void> {
    return this.delete(key);
  }

  /**
   * Clear all keys matching a pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      if (!this.isConnected || !this.client) {
        throw new Error('Redis client not connected');
      }

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.debug('Cleared cache pattern', { pattern, count: keys.length });
      }
    } catch (error) {
      logError(new Error('Failed to clear cache pattern'), {
        pattern,
        error: (error as Error).message
      });
      throw error;
    }
  }
}

// Export singleton instance
export const redisService = new RedisService();
