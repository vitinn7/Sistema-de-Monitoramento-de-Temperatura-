// TemperatureCard Logic Tests
import { describe, it, expect } from 'vitest';

describe('TemperatureCard Logic', () => {
  describe('Temperature Display Logic', () => {
    it('should format temperature values correctly', () => {
      const temperature = 25.678;
      const formatted = Math.round(temperature * 10) / 10;
      
      expect(formatted).toBe(25.7);
    });

    it('should handle negative temperatures', () => {
      const temperature = -5.234;
      const formatted = Math.round(temperature * 10) / 10;
      
      expect(formatted).toBe(-5.2);
    });

    it('should handle zero temperature', () => {
      const temperature = 0;
      const formatted = Math.round(temperature * 10) / 10;
      
      expect(formatted).toBe(0);
    });
  });

  describe('Temperature Status Logic', () => {
    it('should determine temperature status based on ranges', () => {
      const getTemperatureStatus = (temp: number) => {
        if (temp >= 35) return 'very-hot';
        if (temp >= 30) return 'hot';
        if (temp >= 20) return 'warm';
        if (temp >= 10) return 'cool';
        if (temp >= 0) return 'cold';
        return 'very-cold';
      };

      expect(getTemperatureStatus(38)).toBe('very-hot');
      expect(getTemperatureStatus(32)).toBe('hot');
      expect(getTemperatureStatus(25)).toBe('warm');
      expect(getTemperatureStatus(15)).toBe('cool');
      expect(getTemperatureStatus(5)).toBe('cold');
      expect(getTemperatureStatus(-5)).toBe('very-cold');
    });

    it('should apply correct CSS classes based on temperature status', () => {
      const getStatusClass = (status: string) => {
        const statusClasses = {
          'very-hot': 'bg-red-500 text-white',
          'hot': 'bg-orange-400 text-white',
          'warm': 'bg-yellow-300 text-black',
          'cool': 'bg-blue-300 text-black',
          'cold': 'bg-blue-500 text-white',
          'very-cold': 'bg-purple-600 text-white'
        };
        
        return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-200 text-black';
      };

      expect(getStatusClass('very-hot')).toBe('bg-red-500 text-white');
      expect(getStatusClass('warm')).toBe('bg-yellow-300 text-black');
      expect(getStatusClass('cold')).toBe('bg-blue-500 text-white');
      expect(getStatusClass('unknown')).toBe('bg-gray-200 text-black');
    });
  });

  describe('Humidity Display Logic', () => {
    it('should format humidity percentage correctly', () => {
      const humidity = 65.789;
      const formatted = Math.round(humidity);
      
      expect(formatted).toBe(66);
      expect(typeof formatted).toBe('number');
    });

    it('should validate humidity range', () => {
      const validateHumidity = (humidity: number) => {
        return humidity >= 0 && humidity <= 100;
      };

      expect(validateHumidity(50)).toBe(true);
      expect(validateHumidity(0)).toBe(true);
      expect(validateHumidity(100)).toBe(true);
      expect(validateHumidity(-10)).toBe(false);
      expect(validateHumidity(150)).toBe(false);
    });

    it('should determine humidity comfort level', () => {
      const getHumidityComfort = (humidity: number) => {
        if (humidity < 30) return 'low';
        if (humidity <= 60) return 'comfortable';
        if (humidity <= 80) return 'high';
        return 'very-high';
      };

      expect(getHumidityComfort(25)).toBe('low');
      expect(getHumidityComfort(50)).toBe('comfortable');
      expect(getHumidityComfort(70)).toBe('high');
      expect(getHumidityComfort(90)).toBe('very-high');
    });
  });

  describe('Pressure Display Logic', () => {
    it('should format pressure values correctly', () => {
      const pressure = 1013.25678;
      const formatted = Math.round(pressure * 100) / 100;
      
      expect(formatted).toBe(1013.26);
    });

    it('should convert pressure units if needed', () => {
      const pressureInHPa = 1013.25;
      const pressureInMmHg = pressureInHPa * 0.750062;
      
      expect(Math.round(pressureInMmHg)).toBe(760);
    });

    it('should determine pressure trend', () => {
      const getPressureTrend = (current: number, previous: number) => {
        const diff = current - previous;
        if (diff > 3) return 'rising';
        if (diff < -3) return 'falling';
        return 'stable';
      };

      expect(getPressureTrend(1020, 1015)).toBe('rising');
      expect(getPressureTrend(1010, 1015)).toBe('falling');
      expect(getPressureTrend(1015, 1013)).toBe('stable');
    });
  });

  describe('Weather Description Logic', () => {
    it('should format weather descriptions correctly', () => {
      const descriptions = ['ensolarado', 'NUBLADO', 'Chuva Leve'];
      
      const formatted = descriptions.map(desc => 
        desc.charAt(0).toUpperCase() + desc.slice(1).toLowerCase()
      );

      expect(formatted[0]).toBe('Ensolarado');
      expect(formatted[1]).toBe('Nublado');
      expect(formatted[2]).toBe('Chuva leve');
    });

    it('should determine weather icon based on description', () => {
      const getWeatherIcon = (description: string) => {
        const desc = description.toLowerCase();
        if (desc.includes('ensolarado') || desc.includes('sol')) return '☀️';
        if (desc.includes('nublado') || desc.includes('nuvem')) return '☁️';
        if (desc.includes('chuva')) return '🌧️';
        if (desc.includes('neve')) return '❄️';
        return '🌤️';
      };

      expect(getWeatherIcon('Ensolarado')).toBe('☀️');
      expect(getWeatherIcon('Nublado')).toBe('☁️');
      expect(getWeatherIcon('Chuva leve')).toBe('🌧️');
      expect(getWeatherIcon('Desconhecido')).toBe('🌤️');
    });
  });

  describe('Card Data Validation', () => {
    it('should validate complete temperature card data', () => {
      const cardData = {
        id: 1,
        cidade_nome: 'São Paulo',
        temperatura: 25.5,
        sensacao_termica: 27.0,
        umidade: 60,
        pressao: 1013.25,
        descricao_tempo: 'Ensolarado',
        data_hora: new Date()
      };

      const isValid = (
        typeof cardData.id === 'number' &&
        typeof cardData.cidade_nome === 'string' &&
        cardData.cidade_nome.length > 0 &&
        typeof cardData.temperatura === 'number' &&
        !isNaN(cardData.temperatura) &&
        typeof cardData.umidade === 'number' &&
        cardData.umidade >= 0 &&
        cardData.umidade <= 100 &&
        typeof cardData.pressao === 'number' &&
        cardData.pressao > 0 &&
        cardData.data_hora instanceof Date
      );

      expect(isValid).toBe(true);
    });

    it('should handle missing or invalid data gracefully', () => {
      const invalidCardData = {
        id: null,
        cidade_nome: '',
        temperatura: NaN,
        umidade: 150,
        pressao: -100,
        data_hora: 'invalid-date'
      };

      const sanitizedData = {
        id: invalidCardData.id || 0,
        cidade_nome: invalidCardData.cidade_nome || 'Cidade desconhecida',
        temperatura: isNaN(invalidCardData.temperatura) ? 0 : invalidCardData.temperatura,
        umidade: Math.max(0, Math.min(100, invalidCardData.umidade || 0)),
        pressao: invalidCardData.pressao && invalidCardData.pressao > 0 ? invalidCardData.pressao : 1013.25,
        data_hora: new Date()
      };

      expect(sanitizedData.id).toBe(0);
      expect(sanitizedData.cidade_nome).toBe('Cidade desconhecida');
      expect(sanitizedData.temperatura).toBe(0);
      expect(sanitizedData.umidade).toBe(100);
      expect(sanitizedData.pressao).toBe(1013.25);
      expect(sanitizedData.data_hora).toBeInstanceOf(Date);
    });
  });

  describe('Time Formatting Logic', () => {
    it('should format datetime correctly', () => {
      const date = new Date('2024-01-15T14:30:25');
      
      const formatTime = (date: Date) => {
        return date.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      const formatted = formatTime(date);
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should calculate time ago display', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const getTimeAgo = (date: Date) => {
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days > 0) return `${days} dia(s) atrás`;
        if (hours > 0) return `${hours} hora(s) atrás`;
        return `${minutes} minuto(s) atrás`;
      };

      expect(getTimeAgo(oneHourAgo)).toContain('hora');
      expect(getTimeAgo(oneDayAgo)).toContain('dia');
    });
  });
});
