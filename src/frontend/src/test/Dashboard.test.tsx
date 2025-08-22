// Dashboard Component Tests  
import { describe, it, expect } from 'vitest';

describe('Dashboard Logic Tests', () => {
  describe('Temperature Processing', () => {
    it('should format temperature values correctly', () => {
      const temperature = 25.567;
      const formatted = Number(temperature.toFixed(1));
      
      expect(formatted).toBe(25.6);
      expect(typeof formatted).toBe('number');
    });

    it('should calculate temperature statistics', () => {
      const temperatures = [20.5, 25.0, 30.2, 18.7, 22.1];
      
      const min = Math.min(...temperatures);
      const max = Math.max(...temperatures);
      const avg = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
      
      expect(min).toBe(18.7);
      expect(max).toBe(30.2);
      expect(avg).toBeCloseTo(23.3, 1);
    });

    it('should handle empty temperature arrays', () => {
      const temperatures: number[] = [];
      
      const result = temperatures.length > 0 
        ? temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length
        : 0;
      
      expect(result).toBe(0);
    });
  });

  describe('Alert System Logic', () => {
    it('should determine alert status for different temperatures', () => {
      const getAlertStatus = (temp: number, city: string) => {
        const thresholds = {
          'São Paulo': { high: 35, low: 5 },
          'Rio de Janeiro': { high: 38, low: 8 },
          'Brasília': { high: 36, low: 2 }
        };
        
        const threshold = thresholds[city as keyof typeof thresholds] || thresholds['São Paulo'];
        
        if (temp > threshold.high) return 'high';
        if (temp < threshold.low) return 'low';
        return 'normal';
      };
      
      expect(getAlertStatus(40, 'São Paulo')).toBe('high');
      expect(getAlertStatus(3, 'São Paulo')).toBe('low');
      expect(getAlertStatus(25, 'São Paulo')).toBe('normal');
      
      expect(getAlertStatus(39, 'Rio de Janeiro')).toBe('high');
      expect(getAlertStatus(1, 'Brasília')).toBe('low');
    });

    it('should determine alert colors based on status', () => {
      const getAlertColor = (status: string) => {
        switch (status) {
          case 'high': return 'bg-red-100 border-red-500 text-red-700';
          case 'low': return 'bg-blue-100 border-blue-500 text-blue-700';
          default: return 'bg-green-100 border-green-500 text-green-700';
        }
      };
      
      expect(getAlertColor('high')).toContain('red');
      expect(getAlertColor('low')).toContain('blue');
      expect(getAlertColor('normal')).toContain('green');
    });
  });

  describe('Data Validation', () => {
    it('should validate temperature data structure', () => {
      const temperatureData = {
        id: 1,
        cidade_id: 1,
        cidade_nome: 'São Paulo',
        temperatura: 25.5,
        umidade: 60,
        pressao: 1013.25,
        data_hora: new Date()
      };
      
      expect(typeof temperatureData.id).toBe('number');
      expect(typeof temperatureData.cidade_nome).toBe('string');
      expect(typeof temperatureData.temperatura).toBe('number');
      expect(temperatureData.temperatura).toBeGreaterThan(-50);
      expect(temperatureData.temperatura).toBeLessThan(60);
      expect(temperatureData.umidade).toBeGreaterThanOrEqual(0);
      expect(temperatureData.umidade).toBeLessThanOrEqual(100);
    });

    it('should handle invalid temperature data gracefully', () => {
      const invalidData = {
        temperatura: 'invalid',
        umidade: null,
        pressao: undefined
      };
      
      const processedData = {
        temperatura: typeof invalidData.temperatura === 'number' ? invalidData.temperatura : 0,
        umidade: typeof invalidData.umidade === 'number' ? invalidData.umidade : 0,
        pressao: typeof invalidData.pressao === 'number' ? invalidData.pressao : 0
      };
      
      expect(processedData.temperatura).toBe(0);
      expect(processedData.umidade).toBe(0);
      expect(processedData.pressao).toBe(0);
    });
  });

  describe('City Filtering Logic', () => {
    it('should filter temperatures by city', () => {
      const allTemperatures = [
        { id: 1, cidade_id: 1, cidade_nome: 'São Paulo', temperatura: 25 },
        { id: 2, cidade_id: 2, cidade_nome: 'Rio de Janeiro', temperatura: 28 },
        { id: 3, cidade_id: 1, cidade_nome: 'São Paulo', temperatura: 26 },
        { id: 4, cidade_id: 3, cidade_nome: 'Brasília', temperatura: 24 }
      ];
      
      const filterByCity = (temps: typeof allTemperatures, cityId: number) => {
        return cityId === 0 ? temps : temps.filter(t => t.cidade_id === cityId);
      };
      
      const spTemps = filterByCity(allTemperatures, 1);
      expect(spTemps).toHaveLength(2);
      expect(spTemps.every(t => t.cidade_id === 1)).toBe(true);
      
      const allCities = filterByCity(allTemperatures, 0);
      expect(allCities).toHaveLength(4);
    });

    it('should extract unique cities from temperature data', () => {
      const temperatureData = [
        { cidade_id: 1, cidade_nome: 'São Paulo' },
        { cidade_id: 2, cidade_nome: 'Rio de Janeiro' },
        { cidade_id: 1, cidade_nome: 'São Paulo' },
        { cidade_id: 3, cidade_nome: 'Brasília' }
      ];
      
      const uniqueCities = Array.from(
        new Map(temperatureData.map(item => [item.cidade_id, item])).values()
      );
      
      expect(uniqueCities).toHaveLength(3);
      expect(uniqueCities.map(c => c.cidade_nome)).toContain('São Paulo');
      expect(uniqueCities.map(c => c.cidade_nome)).toContain('Rio de Janeiro');
      expect(uniqueCities.map(c => c.cidade_nome)).toContain('Brasília');
    });
  });
});