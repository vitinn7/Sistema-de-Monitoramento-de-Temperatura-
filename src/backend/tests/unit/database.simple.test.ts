// Simple Database Service Test
import { DatabaseService } from '../../../src/backend/src/services/database.service';

// Mock the pg module completely
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockEnd = jest.fn();
const mockOn = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: mockQuery,
    connect: mockConnect, 
    end: mockEnd,
    on: mockOn
  }))
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(), 
    debug: jest.fn()
  },
  logDatabaseOperation: jest.fn(),
  logError: jest.fn()
}));

// Mock config
jest.mock('../../src/config/environment', () => ({
  config: {
    database: {
      host: 'localhost',
      port: 5432,
      database: 'test_db', 
      username: 'test',
      password: 'test',
      ssl: false,
      maxConnections: 20
    }
  }
}));

describe('DatabaseService', () => {
  let databaseService: DatabaseService;

  beforeEach(() => {
    jest.clearAllMocks();
    databaseService = new DatabaseService();
  });

  describe('Basic Operations', () => {
    it('should create instance successfully', () => {
      expect(databaseService).toBeInstanceOf(DatabaseService);
    });

    it('should execute simple query', async () => {
      // Mock query result
      const mockResult = { 
        rows: [{ id: 1, name: 'Test' }],
        rowCount: 1 
      };
      mockQuery.mockResolvedValueOnce(mockResult);

      const result = await databaseService.query('SELECT * FROM test');

      expect(result).toEqual([{ id: 1, name: 'Test' }]);
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM test', undefined);
    });

    it('should handle query errors', async () => {
      const error = new Error('Query failed');
      mockQuery.mockRejectedValueOnce(error);

      await expect(databaseService.query('BAD SQL')).rejects.toThrow('Query failed');
    });
  });

  describe('City Operations', () => {
    it('should get cities', async () => {
      const mockCities = [{ id: 1, nome: 'São Paulo' }];
      mockQuery.mockResolvedValueOnce({ rows: mockCities });

      const result = await databaseService.getCidades();

      expect(result).toEqual(mockCities);
    });
  });

  describe('Temperature Operations', () => {
    it('should convert string numbers to actual numbers in temperature history', async () => {
      const mockData = [{
        id: 1,
        temperatura: '25.5',
        umidade: '60',
        pressao: '1013.25'
      }];
      
      mockQuery.mockResolvedValueOnce({ rows: mockData });

      const result = await databaseService.getTemperatureHistory(1);

      expect(result[0].temperatura).toBe(25.5);
      expect(result[0].umidade).toBe(60);  
      expect(result[0].pressao).toBe(1013.25);
    });
  });
});
