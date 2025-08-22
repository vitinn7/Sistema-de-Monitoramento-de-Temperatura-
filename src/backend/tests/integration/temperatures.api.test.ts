// Integration tests for Temperatures API endpoints
import request from 'supertest';
import app from '../../src/app';

describe('Temperatures API Integration Tests', () => {
  describe('GET /api/v1/temperaturas/atuais', () => {
    it('should return current temperatures for all cities', async () => {
      const response = await request(app)
        .get('/api/v1/temperaturas/atuais')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const temp = response.body[0];
        expect(temp).toHaveProperty('id');
        expect(temp).toHaveProperty('cidade_id');
        expect(temp).toHaveProperty('temperatura');
        expect(temp).toHaveProperty('cidade_nome');
        
        // Validate temperature is a number and within reasonable range
        expect(typeof temp.temperatura).toBe('number');
        expect(temp.temperatura).toBeValidTemperature();
      }
    });

    it('should return temperatures with complete data structure', async () => {
      const response = await request(app)
        .get('/api/v1/temperaturas/atuais')
        .expect(200);

      response.body.forEach((temp: any) => {
        expect(typeof temp.id).toBe('number');
        expect(typeof temp.cidade_id).toBe('number');
        expect(typeof temp.temperatura).toBe('number');
        expect(typeof temp.cidade_nome).toBe('string');
        
        // Validate temperature range
        expect(temp.temperatura).toBeGreaterThan(-100);
        expect(temp.temperatura).toBeLessThan(60);
      });
    });
  });

  describe('GET /api/v1/temperaturas/historico', () => {
    it('should return temperature history with default parameters', async () => {
      const response = await request(app)
        .get('/api/v1/temperaturas/historico')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const temp = response.body[0];
        expect(temp).toHaveProperty('temperatura');
        expect(temp).toHaveProperty('data_hora');
        expect(temp).toHaveProperty('cidade_nome');
        
        // Validate data conversion (critical fix)
        expect(typeof temp.temperatura).toBe('number');
        expect(temp.temperatura).toBeValidTemperature();
      }
    });

    it('should accept period and limit parameters', async () => {
      const response = await request(app)
        .get('/api/v1/temperaturas/historico?periodo=24h&limit=5')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    it('should filter by city when cidade_id is provided', async () => {
      // First get available cities
      const citiesResponse = await request(app)
        .get('/api/v1/cidades')
        .expect(200);

      if (citiesResponse.body.length > 0) {
        const cityId = citiesResponse.body[0].id;
        
        const response = await request(app)
          .get(`/api/v1/temperaturas/historico?cidade_id=${cityId}`)
          .expect(200);

        // All returned temperatures should be for the specified city
        response.body.forEach((temp: any) => {
          expect(temp.cidade_id).toBe(cityId);
        });
      }
    });
  });

  describe('GET /api/v1/temperaturas/estatisticas', () => {
    it('should return system statistics', async () => {
      const response = await request(app)
        .get('/api/v1/temperaturas/estatisticas')
        .expect(200);

      expect(response.body).toHaveProperty('cidades_ativas');
      expect(response.body).toHaveProperty('temperaturas_24h');
      expect(response.body).toHaveProperty('temp_media_1h');
      
      // Validate statistics are numbers
      expect(typeof response.body.cidades_ativas).toBe('number');
      expect(typeof response.body.temperaturas_24h).toBe('number');
      
      // Average temperature should be valid if exists
      if (response.body.temp_media_1h !== null) {
        expect(typeof response.body.temp_media_1h).toBe('number');
        expect(response.body.temp_media_1h).toBeValidTemperature();
      }
    });
  });

  describe('API Performance and Reliability', () => {
    it('should respond within reasonable time limits', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/temperaturas/atuais')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(3).fill(null).map(() => 
        request(app)
          .get('/api/v1/temperaturas/atuais')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    it('should handle invalid query parameters gracefully', async () => {
      await request(app)
        .get('/api/v1/temperaturas/historico?limite=invalid')
        .expect(400);

      await request(app)
        .get('/api/v1/temperaturas/historico?cidade_id=abc')
        .expect(400);
    });
  });
});
