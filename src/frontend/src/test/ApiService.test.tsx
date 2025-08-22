// API Service Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

describe('API Service Logic', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('HTTP Request Handling', () => {
    it('should construct correct API URLs', () => {
      const baseURL = 'http://localhost:3001/api';
      const endpoints = {
        temperatures: '/temperatures',
        cities: '/cities',
        alerts: '/alerts'
      };

      const buildURL = (endpoint: string, params?: Record<string, string>) => {
        const url = new URL(`${baseURL}${endpoint}`);
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
          });
        }
        return url.toString();
      };

      const temperaturesURL = buildURL(endpoints.temperatures);
      expect(temperaturesURL).toBe('http://localhost:3001/api/temperatures');

      const citiesURL = buildURL(endpoints.cities, { limit: '10' });
      expect(citiesURL).toBe('http://localhost:3001/api/cities?limit=10');

      const alertsURL = buildURL(endpoints.alerts, { severity: 'high', type: 'temperature' });
      expect(alertsURL).toBe('http://localhost:3001/api/alerts?severity=high&type=temperature');
    });

    it('should handle query parameters correctly', () => {
      const addQueryParams = (url: string, params: Record<string, any>) => {
        const urlObj = new URL(url);
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            urlObj.searchParams.append(key, String(value));
          }
        });
        return urlObj.toString();
      };

      const baseUrl = 'http://localhost:3001/api/temperatures';
      const params = {
        cidade_id: 1,
        limit: 50,
        order: 'DESC',
        undefined_param: undefined,
        null_param: null
      };

      const finalUrl = addQueryParams(baseUrl, params);
      
      expect(finalUrl).toContain('cidade_id=1');
      expect(finalUrl).toContain('limit=50');
      expect(finalUrl).toContain('order=DESC');
      expect(finalUrl).not.toContain('undefined_param');
      expect(finalUrl).not.toContain('null_param');
    });
  });

  describe('Response Handling', () => {
    it('should handle successful API responses', async () => {
      const mockResponseData = {
        success: true,
        data: [
          { id: 1, cidade_nome: 'São Paulo', temperatura: 25.5 },
          { id: 2, cidade_nome: 'Rio de Janeiro', temperatura: 28.0 }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponseData
      });

      const handleAPIResponse = async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      };

      const result = await handleAPIResponse('http://localhost:3001/api/temperatures');
      
      expect(result).toEqual(mockResponseData);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should handle API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' })
      });

      const handleAPIResponse = async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      };

      await expect(handleAPIResponse('http://localhost:3001/api/temperatures'))
        .rejects.toThrow('HTTP error! status: 500');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const handleAPIResponse = async (url: string) => {
        try {
          const response = await fetch(url);
          return response.json();
        } catch (error) {
          throw new Error(`Network error: ${(error as Error).message}`);
        }
      };

      await expect(handleAPIResponse('http://localhost:3001/api/temperatures'))
        .rejects.toThrow('Network error: Network error');
    });
  });

  describe('Data Transformation', () => {
    it('should transform temperature data correctly', () => {
      const rawTemperatureData = {
        id: 1,
        cidade_id: 1,
        cidade_nome: 'São Paulo',
        temperatura: '25.5',  // String from API
        sensacao_termica: '27.0',
        umidade: '60',
        pressao: '1013.25',
        descricao_tempo: 'ensolarado',
        data_hora: '2024-01-15T14:30:00.000Z'
      };

      const transformTemperatureData = (data: typeof rawTemperatureData) => {
        return {
          ...data,
          temperatura: parseFloat(data.temperatura),
          sensacao_termica: parseFloat(data.sensacao_termica),
          umidade: parseInt(data.umidade),
          pressao: parseFloat(data.pressao),
          descricao_tempo: data.descricao_tempo.charAt(0).toUpperCase() + data.descricao_tempo.slice(1),
          data_hora: new Date(data.data_hora)
        };
      };

      const transformedData = transformTemperatureData(rawTemperatureData);

      expect(typeof transformedData.temperatura).toBe('number');
      expect(transformedData.temperatura).toBe(25.5);
      expect(typeof transformedData.umidade).toBe('number');
      expect(transformedData.umidade).toBe(60);
      expect(transformedData.descricao_tempo).toBe('Ensolarado');
      expect(transformedData.data_hora).toBeInstanceOf(Date);
    });

    it('should handle invalid data during transformation', () => {
      const invalidData = {
        temperatura: 'invalid',
        umidade: 'not_a_number',
        pressao: null,
        data_hora: 'invalid_date'
      };

      const safeTransform = (data: any) => {
        return {
          temperatura: isNaN(parseFloat(data.temperatura)) ? 0 : parseFloat(data.temperatura),
          umidade: isNaN(parseInt(data.umidade)) ? 0 : parseInt(data.umidade),
          pressao: isNaN(parseFloat(data.pressao)) ? 1013.25 : parseFloat(data.pressao),
          data_hora: isNaN(Date.parse(data.data_hora)) ? new Date() : new Date(data.data_hora)
        };
      };

      const transformedData = safeTransform(invalidData);

      expect(transformedData.temperatura).toBe(0);
      expect(transformedData.umidade).toBe(0);
      expect(transformedData.pressao).toBe(1013.25);
      expect(transformedData.data_hora).toBeInstanceOf(Date);
    });
  });

  describe('Caching Logic', () => {
    it('should implement simple cache logic', () => {
      interface CacheEntry<T> {
        data: T;
        timestamp: number;
        expiry: number;
      }

      class SimpleCache<T> {
        private cache = new Map<string, CacheEntry<T>>();

        set(key: string, data: T, ttlMs: number = 300000): void { // 5 min default
          this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiry: Date.now() + ttlMs
          });
        }

        get(key: string): T | null {
          const entry = this.cache.get(key);
          if (!entry || Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
          }
          return entry.data;
        }

        clear(): void {
          this.cache.clear();
        }
      }

      const cache = new SimpleCache<any>();
      const testData = { id: 1, name: 'Test' };

      cache.set('test-key', testData, 1000);
      expect(cache.get('test-key')).toEqual(testData);

      // Test cache miss
      expect(cache.get('non-existent')).toBeNull();

      // Test expiry (simulate)
      cache.set('expire-test', testData, -1); // Already expired
      expect(cache.get('expire-test')).toBeNull();
    });

    it('should determine if cache should be used', () => {
      const shouldUseCache = (endpoint: string, params?: Record<string, any>) => {
        // Don't cache real-time data or POST requests
        const realTimeEndpoints = ['/alerts', '/live-temperatures'];
        const hasRealTimeParams = params && (params.live === 'true' || params.realtime === 'true');
        
        return !realTimeEndpoints.some(rt => endpoint.includes(rt)) && !hasRealTimeParams;
      };

      expect(shouldUseCache('/temperatures')).toBe(true);
      expect(shouldUseCache('/cities')).toBe(true);
      expect(shouldUseCache('/alerts')).toBe(false);
      expect(shouldUseCache('/temperatures', { live: 'true' })).toBe(false);
      expect(shouldUseCache('/temperatures', { cidade_id: '1' })).toBe(true);
    });
  });

  describe('Request Configuration', () => {
    it('should build correct request headers', () => {
      const buildHeaders = (options?: { auth?: string; contentType?: string }) => {
        const headers: Record<string, string> = {
          'Content-Type': options?.contentType || 'application/json',
          'Accept': 'application/json'
        };

        if (options?.auth) {
          headers['Authorization'] = `Bearer ${options.auth}`;
        }

        return headers;
      };

      const basicHeaders = buildHeaders();
      expect(basicHeaders['Content-Type']).toBe('application/json');
      expect(basicHeaders['Accept']).toBe('application/json');

      const authHeaders = buildHeaders({ auth: 'test-token' });
      expect(authHeaders['Authorization']).toBe('Bearer test-token');

      const customHeaders = buildHeaders({ contentType: 'text/plain' });
      expect(customHeaders['Content-Type']).toBe('text/plain');
    });

    it('should configure request timeouts', () => {
      const createRequestConfig = (timeoutMs: number = 10000) => {
        return {
          timeout: timeoutMs,
          signal: AbortSignal.timeout(timeoutMs)
        };
      };

      const defaultConfig = createRequestConfig();
      expect(defaultConfig.timeout).toBe(10000);
      expect(defaultConfig.signal).toBeInstanceOf(AbortSignal);

      const customConfig = createRequestConfig(5000);
      expect(customConfig.timeout).toBe(5000);
    });
  });

  describe('Error Handling Strategies', () => {
    it('should implement retry logic for failed requests', async () => {
      let attempts = 0;
      const mockFailingFetch = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network error');
        }
        return {
          ok: true,
          json: async () => ({ success: true, data: [] })
        };
      });

      const retryRequest = async (
        fetchFn: () => Promise<any>,
        maxRetries: number = 3,
        delayMs: number = 100
      ) => {
        let lastError: Error;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            return await fetchFn();
          } catch (error) {
            lastError = error as Error;
            if (attempt === maxRetries) break;
            
            // Simple delay for testing
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
        
        throw lastError!;
      };

      const result = await retryRequest(mockFailingFetch, 3, 10);
      expect(result.ok).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should categorize different error types', () => {
      const categorizeError = (error: any) => {
        if (error.name === 'AbortError') return 'timeout';
        if (error.message?.includes('Network')) return 'network';
        if (error.status >= 400 && error.status < 500) return 'client';
        if (error.status >= 500) return 'server';
        return 'unknown';
      };

      expect(categorizeError({ name: 'AbortError' })).toBe('timeout');
      expect(categorizeError({ message: 'Network error' })).toBe('network');
      expect(categorizeError({ status: 404 })).toBe('client');
      expect(categorizeError({ status: 500 })).toBe('server');
      expect(categorizeError({ message: 'Unknown error' })).toBe('unknown');
    });
  });
});
