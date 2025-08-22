// Integration tests for Cities API endpoints
import request from 'supertest';
import app from '../../src/app';

describe('Cities API Integration Tests', () => {
  describe('GET /api/v1/cidades', () => {
    it('should return list of active cities', async () => {
      const response = await request(app)
        .get('/api/v1/cidades')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const city = response.body[0];
        expect(city).toHaveProperty('id');
        expect(city).toHaveProperty('nome');
        expect(city).toHaveProperty('estado');
        expect(city).toHaveProperty('ativa');
        expect(city.ativa).toBe(true);
      }
    });

    it('should return cities with correct data structure', async () => {
      const response = await request(app)
        .get('/api/v1/cidades')
        .expect(200);

      response.body.forEach((city: any) => {
        expect(typeof city.id).toBe('number');
        expect(typeof city.nome).toBe('string');
        expect(typeof city.estado).toBe('string');
        expect(typeof city.ativa).toBe('boolean');
        expect(city.nome.length).toBeGreaterThan(0);
        expect(city.estado.length).toBeGreaterThan(0);
      });
    });
  });

  describe('GET /api/v1/cidades/:id', () => {
    it('should return a specific city by ID', async () => {
      // First get a city ID
      const citiesResponse = await request(app)
        .get('/api/v1/cidades')
        .expect(200);

      if (citiesResponse.body.length > 0) {
        const cityId = citiesResponse.body[0].id;
        
        const response = await request(app)
          .get(`/api/v1/cidades/${cityId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', cityId);
        expect(response.body).toHaveProperty('nome');
        expect(response.body).toHaveProperty('estado');
      }
    });

    it('should return 404 for non-existent city', async () => {
      const response = await request(app)
        .get('/api/v1/cidades/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid city ID', async () => {
      await request(app)
        .get('/api/v1/cidades/invalid')
        .expect(400);
    });
  });

  describe('API Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/cidades/abc')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return proper content-type headers', async () => {
      await request(app)
        .get('/api/v1/cidades')
        .expect('Content-Type', /application\/json/);
    });
  });
});
