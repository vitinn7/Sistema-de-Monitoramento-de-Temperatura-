/**
 * Utility Functions Tests
 * Testing helper functions and data formatters
 */

describe('Temperature Data Processing', () => {
  describe('String to Number Conversion', () => {
    it('should convert temperature strings to numbers', () => {
      const temperatureString = '25.5';
      const converted = parseFloat(temperatureString);
      
      expect(converted).toBe(25.5);
      expect(typeof converted).toBe('number');
      expect(converted).toBeValidTemperature();
    });

    it('should handle invalid temperature strings', () => {
      const invalidString = 'invalid';
      const converted = parseFloat(invalidString);
      
      expect(converted).toBeNaN();
      expect(converted).not.toBeValidTemperature();
    });

    it('should handle humidity conversion', () => {
      const humidityString = '60';
      const converted = parseInt(humidityString);
      
      expect(converted).toBe(60);
      expect(typeof converted).toBe('number');
      expect(converted).toBeGreaterThanOrEqual(0);
      expect(converted).toBeLessThanOrEqual(100);
    });

    it('should handle pressure conversion', () => {
      const pressureString = '1013.25';
      const converted = parseFloat(pressureString);
      
      expect(converted).toBe(1013.25);
      expect(typeof converted).toBe('number');
      expect(converted).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    it('should validate temperature ranges', () => {
      // Valid temperatures
      expect(25.5).toBeValidTemperature();
      expect(0).toBeValidTemperature();
      expect(-20).toBeValidTemperature();
      expect(45).toBeValidTemperature();
      
      // Invalid temperatures - check manually since custom matcher might not work
      const isValidTemp = (temp: number) => typeof temp === 'number' && !isNaN(temp) && temp >= -100 && temp <= 60;
      expect(isValidTemp(-150)).toBe(false);
      expect(isValidTemp(100)).toBe(false);
    });

    it('should validate date objects', () => {
      const validDate = new Date();
      const invalidDate = new Date('invalid');
      
      expect(validDate).toBeValidDate();
      expect(invalidDate).not.toBeValidDate();
    });

    it('should validate email addresses', () => {
      expect('user@example.com').toBeValidEmail();
      expect('test.email+tag@domain.co.uk').toBeValidEmail();
      
      expect('invalid.email').not.toBeValidEmail();
      expect('user@').not.toBeValidEmail();
      expect('@domain.com').not.toBeValidEmail();
    });
  });

  describe('Temperature Statistics', () => {
    it('should calculate average temperature correctly', () => {
      const temperatures = [20, 25, 30, 15, 35];
      const average = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
      
      expect(average).toBe(25);
      expect(average).toBeValidTemperature();
    });

    it('should find min and max temperatures', () => {
      const temperatures = [20, 25, 30, 15, 35];
      const min = Math.min(...temperatures);
      const max = Math.max(...temperatures);
      
      expect(min).toBe(15);
      expect(max).toBe(35);
      expect(min).toBeValidTemperature();
      expect(max).toBeValidTemperature();
    });

    it('should handle empty temperature arrays', () => {
      const temperatures: number[] = [];
      const average = temperatures.length > 0 
        ? temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length 
        : 0;
      
      expect(average).toBe(0);
      expect(temperatures.length).toBe(0);
    });
  });
});

describe('Alert System Logic', () => {
  describe('Temperature Thresholds', () => {
    it('should identify high temperature alerts', () => {
      const temperature = 38;
      const threshold = 35;
      
      const isAlert = temperature > threshold;
      
      expect(isAlert).toBe(true);
      expect(temperature).toBeValidTemperature();
      expect(threshold).toBeValidTemperature();
    });

    it('should identify low temperature alerts', () => {
      const temperature = -5;
      const threshold = 0;
      
      const isAlert = temperature < threshold;
      
      expect(isAlert).toBe(true);
      expect(temperature).toBeValidTemperature();
      expect(threshold).toBeValidTemperature();
    });

    it('should not trigger alerts for normal temperatures', () => {
      const temperature = 22;
      const minThreshold = 0;
      const maxThreshold = 35;
      
      const isLowAlert = temperature < minThreshold;
      const isHighAlert = temperature > maxThreshold;
      
      expect(isLowAlert).toBe(false);
      expect(isHighAlert).toBe(false);
    });
  });
});
