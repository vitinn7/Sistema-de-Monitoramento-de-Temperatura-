/**
 * OpenWeather API Service
 * Sistema de Monitoramento de Temperatura
 * Subagente: Backend Developer (Node.js, Express, TypeScript)
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../config/environment';
import { logger, logError, logExternalApiCall } from '../utils/logger';
import { redisService } from './redis.service';

export interface OpenWeatherCurrentResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface ProcessedWeatherData {
  cidadeId: number;
  temperatura: number;
  sensacaoTermica: number;
  umidade: number;
  pressao: number;
  descricao: string;
  vento: {
    velocidade: number;
    direcao: number;
  };
  nuvens: number;
  visibilidade: number;
  timestamp: Date;
  sunrise: Date;
  sunset: Date;
}

export interface WeatherError {
  code: number;
  message: string;
  details?: any;
}

export class OpenWeatherService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private readonly rateLimitPerMinute: number = 60; // OpenWeather free tier limit
  private readonly cacheTTL: number = 600; // 10 minutes

  constructor() {
    this.apiKey = config.openWeather.apiKey;
    this.baseUrl = config.openWeather.baseUrl;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.openWeather.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TemperatureMonitoringSystem/1.0'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const startTime = Date.now();
        (config as any).startTime = startTime;
        
        logger.debug('OpenWeather API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params
        });

        return config;
      },
      (error) => {
        logError(new Error('OpenWeather API request setup failed'), {
          error: error.message
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const duration = Date.now() - (response.config as any).startTime;
        
        logExternalApiCall(
          'OpenWeather API',
          response.config.url || 'unknown',
          response.status,
          duration
        );

        return response;
      },
      (error) => {
        const duration = error.config?.startTime 
          ? Date.now() - error.config.startTime 
          : 0;

        logError(new Error('OpenWeather API request failed'), {
          url: error.config?.url,
          status: error.response?.status,
          statusText: error.response?.statusText,
          duration,
          data: error.response?.data
        });

        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  /**
   * Handle API errors and convert to standardized format
   */
  private handleApiError(error: any): WeatherError {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          return {
            code: 401,
            message: 'Invalid API key. Please check your OpenWeather API key.',
            details: data
          };
        case 404:
          return {
            code: 404,
            message: 'City not found. Please check the city ID.',
            details: data
          };
        case 429:
          return {
            code: 429,
            message: 'API rate limit exceeded. Please try again later.',
            details: data
          };
        case 500:
        case 502:
        case 503:
          return {
            code: status,
            message: 'OpenWeather API server error. Please try again later.',
            details: data
          };
        default:
          return {
            code: status,
            message: data?.message || 'OpenWeather API error',
            details: data
          };
      }
    } else if (error.request) {
      // Request made but no response received
      return {
        code: 0,
        message: 'No response from OpenWeather API. Check your internet connection.',
        details: { timeout: config.openWeather.timeout }
      };
    } else {
      // Something else happened
      return {
        code: -1,
        message: error.message || 'Unknown error occurred',
        details: error
      };
    }
  }

  /**
   * Check rate limiting before making requests
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Reset counter if more than a minute has passed
    if (this.lastRequestTime < oneMinuteAgo) {
      this.requestCount = 0;
    }

    // Check if we're exceeding rate limit
    if (this.requestCount >= this.rateLimitPerMinute) {
      const waitTime = 60000 - (now - this.lastRequestTime);
      
      if (waitTime > 0) {
        logger.warn('Rate limit reached, waiting before next request', {
          waitTime: `${Math.ceil(waitTime / 1000)}s`,
          requestCount: this.requestCount
        });
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
      }
    }

    this.requestCount++;
    this.lastRequestTime = now;
  }

  /**
   * Get current weather data for a city by OpenWeather ID
   */
  async getCurrentWeatherByCity(openWeatherId: number): Promise<OpenWeatherCurrentResponse> {
    // Check cache first
    const cacheKey = `openweather:current:${openWeatherId}`;
    const cachedData = await redisService.getCachedOpenWeatherResponse<OpenWeatherCurrentResponse>(openWeatherId);
    
    if (cachedData) {
      logger.debug('Using cached weather data', { openWeatherId });
      return cachedData;
    }

    // Check rate limiting
    await this.checkRateLimit();

    try {
      const response = await this.client.get<OpenWeatherCurrentResponse>('/weather', {
        params: {
          id: openWeatherId,
          appid: this.apiKey,
          units: 'metric', // Celsius
          lang: 'pt_br' // Portuguese descriptions
        }
      });

      const weatherData = response.data;

      // Validate response
      if (!weatherData || !weatherData.main) {
        throw new Error('Invalid response format from OpenWeather API');
      }

      // Cache the response
      await redisService.cacheOpenWeatherResponse(openWeatherId, weatherData, this.cacheTTL);

      logger.info('Weather data fetched successfully', {
        city: weatherData.name,
        openWeatherId,
        temperature: weatherData.main.temp,
        description: weatherData.weather[0]?.description
      });

      return weatherData;
    } catch (error) {
      if (error instanceof Error) {
        logError(new Error('Failed to fetch weather data'), {
          openWeatherId,
          error: error.message
        });
      }
      throw error;
    }
  }

  /**
   * Process raw OpenWeather data into our application format
   */
  processWeatherData(rawData: OpenWeatherCurrentResponse, cidadeId: number): ProcessedWeatherData {
    const weather = rawData.weather[0] || {};
    
    return {
      cidadeId,
      temperatura: Math.round(rawData.main.temp * 10) / 10, // Round to 1 decimal
      sensacaoTermica: Math.round(rawData.main.feels_like * 10) / 10,
      umidade: rawData.main.humidity,
      pressao: rawData.main.pressure,
      descricao: weather.description || 'N/A',
      vento: {
        velocidade: rawData.wind?.speed || 0,
        direcao: rawData.wind?.deg || 0
      },
      nuvens: rawData.clouds?.all || 0,
      visibilidade: rawData.visibility || 0,
      timestamp: new Date(rawData.dt * 1000),
      sunrise: new Date(rawData.sys.sunrise * 1000),
      sunset: new Date(rawData.sys.sunset * 1000)
    };
  }

  /**
   * Get weather data for multiple cities in batch
   */
  async getCurrentWeatherForCities(openWeatherIds: number[]): Promise<Map<number, ProcessedWeatherData>> {
    const results = new Map<number, ProcessedWeatherData>();
    const errors: Array<{ id: number; error: string }> = [];

    // Process cities in parallel but respect rate limits
    const batchSize = 5; // Process 5 at a time to avoid overwhelming the API
    
    for (let i = 0; i < openWeatherIds.length; i += batchSize) {
      const batch = openWeatherIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (openWeatherId) => {
        try {
          const rawData = await this.getCurrentWeatherByCity(openWeatherId);
          const processedData = this.processWeatherData(rawData, openWeatherId);
          results.set(openWeatherId, processedData);
        } catch (error) {
          errors.push({
            id: openWeatherId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Wait for current batch to complete before processing next batch
      await Promise.all(batchPromises);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < openWeatherIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (errors.length > 0) {
      logger.warn('Some weather data requests failed', { errors });
    }

    logger.info('Batch weather data fetch completed', {
      total: openWeatherIds.length,
      successful: results.size,
      failed: errors.length
    });

    return results;
  }

  /**
   * Test API connectivity and key validity
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with São Paulo's OpenWeather ID
      const testCityId = 3448439;
      await this.getCurrentWeatherByCity(testCityId);
      
      logger.info('OpenWeather API connection test successful');
      return true;
    } catch (error) {
      logError(new Error('OpenWeather API connection test failed'), {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Get API usage statistics
   */
  getUsageStats(): {
    requestCount: number;
    lastRequestTime: Date | null;
    rateLimitPerMinute: number;
  } {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime > 0 ? new Date(this.lastRequestTime) : null,
      rateLimitPerMinute: this.rateLimitPerMinute
    };
  }

  /**
   * Clear API usage counters (useful for testing)
   */
  resetUsageStats(): void {
    this.requestCount = 0;
    this.lastRequestTime = 0;
    logger.debug('OpenWeather API usage stats reset');
  }

  /**
   * Get health status of the service
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastSuccessfulRequest: Date | null;
    currentRateLimit: number;
    apiKeyValid: boolean;
  }> {
    const isConnected = await this.testConnection();
    
    return {
      status: isConnected ? 'healthy' : 'unhealthy',
      lastSuccessfulRequest: this.lastRequestTime > 0 ? new Date(this.lastRequestTime) : null,
      currentRateLimit: this.requestCount,
      apiKeyValid: isConnected
    };
  }

  /**
   * Alias for getCurrentWeatherByCity for compatibility
   */
  async getCurrentWeather(openWeatherId: number): Promise<OpenWeatherCurrentResponse> {
    return this.getCurrentWeatherByCity(openWeatherId);
  }
}

// Export singleton instance
export const openWeatherService = new OpenWeatherService();
