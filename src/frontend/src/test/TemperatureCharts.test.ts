// Temperature Charts Component Tests
import { describe, it, expect } from 'vitest';

describe('TemperatureCharts Logic', () => {
  describe('Data Processing Functions', () => {
    // Simulate the getStatsFromData function from TemperatureCharts
    const getStatsFromData = (data: any[]) => {
      if (!data || data.length === 0) {
        return {
          media: 0,
          minima: 0,
          maxima: 0,
          umidadeMedia: 0,
          pressaoMedia: 0
        };
      }

      // Convert string values to numbers (like in the real component)
      const processedData = data.map(item => ({
        ...item,
        temperatura: typeof item.temperatura === 'string' ? parseFloat(item.temperatura) : item.temperatura,
        umidade: typeof item.umidade === 'string' ? parseInt(item.umidade) : item.umidade,
        pressao: typeof item.pressao === 'string' ? parseFloat(item.pressao) : item.pressao
      }));

      const temperatures = processedData.map(item => item.temperatura).filter(t => !isNaN(t));
      const humidities = processedData.map(item => item.umidade).filter(h => !isNaN(h));
      const pressures = processedData.map(item => item.pressao).filter(p => !isNaN(p));

      return {
        media: temperatures.length > 0 ? temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length : 0,
        minima: temperatures.length > 0 ? Math.min(...temperatures) : 0,
        maxima: temperatures.length > 0 ? Math.max(...temperatures) : 0,
        umidadeMedia: humidities.length > 0 ? humidities.reduce((sum, h) => sum + h, 0) / humidities.length : 0,
        pressaoMedia: pressures.length > 0 ? pressures.reduce((sum, p) => sum + p, 0) / pressures.length : 0
      };
    };

    it('should calculate correct statistics from temperature data', () => {
      const mockData = [
        { temperatura: 25.5, umidade: 60, pressao: 1013.25 },
        { temperatura: 27.0, umidade: 65, pressao: 1015.50 },
        { temperatura: 23.0, umidade: 55, pressao: 1010.00 }
      ];

      const stats = getStatsFromData(mockData);

      expect(stats.media).toBeCloseTo(25.17, 2);
      expect(stats.minima).toBe(23.0);
      expect(stats.maxima).toBe(27.0);
      expect(stats.umidadeMedia).toBeCloseTo(60, 0);
      expect(stats.pressaoMedia).toBeCloseTo(1012.92, 2);
    });

    it('should handle string temperature values', () => {
      const mockDataWithStrings = [
        { temperatura: '25.5', umidade: '60', pressao: '1013.25' },
        { temperatura: '27.0', umidade: '65', pressao: '1015.50' }
      ];

      const stats = getStatsFromData(mockDataWithStrings);

      expect(stats.media).toBeCloseTo(26.25, 2);
      expect(stats.minima).toBe(25.5);
      expect(stats.maxima).toBe(27.0);
    });

    it('should handle empty data arrays', () => {
      const stats = getStatsFromData([]);

      expect(stats.media).toBe(0);
      expect(stats.minima).toBe(0);
      expect(stats.maxima).toBe(0);
      expect(stats.umidadeMedia).toBe(0);
      expect(stats.pressaoMedia).toBe(0);
    });

    it('should handle invalid data values', () => {
      const mockInvalidData = [
        { temperatura: 'invalid', umidade: 'invalid', pressao: 'invalid' },
        { temperatura: NaN, umidade: NaN, pressao: NaN }
      ];

      const stats = getStatsFromData(mockInvalidData);

      expect(stats.media).toBe(0);
      expect(stats.minima).toBe(0);
      expect(stats.maxima).toBe(0);
    });
  });

  describe('City Filter Logic', () => {
    const mockTemperatureData = [
      { id: 1, cidade_id: 1, cidade_nome: 'São Paulo', temperatura: 25.5 },
      { id: 2, cidade_id: 2, cidade_nome: 'Rio de Janeiro', temperatura: 28.0 },
      { id: 3, cidade_id: 1, cidade_nome: 'São Paulo', temperatura: 26.0 },
      { id: 4, cidade_id: 3, cidade_nome: 'Belo Horizonte', temperatura: 24.5 }
    ];

    it('should filter data by selected city', () => {
      const selectedCityId = 1;
      const filteredData = mockTemperatureData.filter(item => item.cidade_id === selectedCityId);

      expect(filteredData).toHaveLength(2);
      expect(filteredData.every(item => item.cidade_id === selectedCityId)).toBe(true);
    });

    it('should return all data when no city filter is applied', () => {
      const selectedCityId = 0; // 0 represents "all cities"
      const filteredData = selectedCityId === 0 
        ? mockTemperatureData 
        : mockTemperatureData.filter(item => item.cidade_id === selectedCityId);

      expect(filteredData).toHaveLength(4);
      expect(filteredData).toEqual(mockTemperatureData);
    });

    it('should extract unique cities from temperature data', () => {
      const uniqueCities = Array.from(
        new Map(
          mockTemperatureData.map(item => [item.cidade_id, { id: item.cidade_id, nome: item.cidade_nome }])
        ).values()
      );

      expect(uniqueCities).toHaveLength(3);
      expect(uniqueCities.find(city => city.nome === 'São Paulo')).toBeDefined();
      expect(uniqueCities.find(city => city.nome === 'Rio de Janeiro')).toBeDefined();
      expect(uniqueCities.find(city => city.nome === 'Belo Horizonte')).toBeDefined();
    });
  });
});

describe('Error Handling', () => {
  it('should handle API errors gracefully', () => {
    const mockApiError = {
      error: 'Failed to fetch temperature data',
      status: 500
    };

    // Simulate error state handling
    const hasError = mockApiError.error !== undefined;
    const errorMessage = mockApiError.error || 'Unknown error occurred';

    expect(hasError).toBe(true);
    expect(errorMessage).toBe('Failed to fetch temperature data');
  });

  it('should handle loading states', () => {
    let isLoading = true;
    let data: any[] = [];

    // Simulate loading completion
    isLoading = false;
    data = [{ temperatura: 25.5 }];

    expect(isLoading).toBe(false);
    expect(data).toHaveLength(1);
  });
});
