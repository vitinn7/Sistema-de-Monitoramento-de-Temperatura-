import { DatabaseService } from '../../src/services/database.service';

// Mock the entire pg module
jest.mock('pg', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };
  
  const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn()
  };
  
  return {
    Pool: jest.fn().mockImplementation(() => mockPool)
  };
});

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  },
  logDatabaseOperation: jest.fn(),
  logError: jest.fn()
}));

// Mock environment config
jest.mock('../../src/config/environment', () => ({
  config: {
    database: {
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      username: 'test_user',
      password: 'test_pass',
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

  describe('Initialization', () => {
    it('should create instance successfully', () => {
      expect(databaseService).toBeInstanceOf(DatabaseService);
    });
  });

  describe('Query Operations', () => {
    it('should execute query and return results', async () => {
      const mockPool = require('pg').Pool();
      const mockResults = [{ id: 1, nome: 'Test City' }];
      
      mockPool.query.mockResolvedValueOnce({
        rows: mockResults,
        rowCount: 1
      });

      const result = await databaseService.query('SELECT * FROM cities');
      
      expect(result).toEqual(mockResults);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM cities', undefined);
    });

    it('should handle query errors', async () => {
      const mockPool = require('pg').Pool();
      const error = new Error('Database query failed');
      
      mockPool.query.mockRejectedValueOnce(error);

      await expect(
        databaseService.query('INVALID SQL')
      ).rejects.toThrow('Database query failed');
    });
  });

  describe('City Operations', () => {
    it('should get all cities', async () => {
      const mockPool = require('pg').Pool();
      const mockCities = [
        { id: 1, nome: 'São Paulo', estado: 'SP', ativa: true },
        { id: 2, nome: 'Rio de Janeiro', estado: 'RJ', ativa: true }
      ];
      
      mockPool.query.mockResolvedValueOnce({
        rows: mockCities
      });

      const result = await databaseService.getCidades();
      
      expect(result).toEqual(mockCities);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, nome, estado')
      );
    });

    it('should get city by ID', async () => {
      const mockPool = require('pg').Pool();
      const mockCity = { id: 1, nome: 'São Paulo', estado: 'SP', ativa: true };
      
      mockPool.query.mockResolvedValueOnce({
        rows: [mockCity]
      });

      const result = await databaseService.getCidadeById(1);
      
      expect(result).toEqual(mockCity);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [1]
      );
    });

    it('should return null when city not found', async () => {
      const mockPool = require('pg').Pool();
      
      mockPool.query.mockResolvedValueOnce({
        rows: []
      });

      const result = await databaseService.getCidadeById(999);
      
      expect(result).toBeNull();
    });
  });

  describe('Temperature Operations', () => {
    it('should insert temperature data', async () => {
      const mockPool = require('pg').Pool();
      
      mockPool.query.mockResolvedValueOnce({
        rows: []
      });

      const temperatureData = {
        cidade_id: 1,
        temperatura: 25.5,
        sensacao_termica: 27.0,
        umidade: 60,
        pressao: 1013.25,
        descricao_tempo: 'Ensolarado'
      };

      await databaseService.insertTemperature(temperatureData);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO temperaturas'),
        expect.arrayContaining([1, 25.5, 27.0, 60, 1013.25])
      );
    });

    it('should get temperature history', async () => {
      const mockPool = require('pg').Pool();
      const mockHistory = [
        { 
          id: 1, 
          cidade_id: 1,
          temperatura: '25.5',
          sensacao_termica: '27.0',
          umidade: '60',
          pressao: '1013.25',
          velocidade_vento: '5.0',
          direcao_vento: '180',
          data_hora: new Date()
        }
      ];
      
      mockPool.query.mockResolvedValueOnce({
        rows: mockHistory
      });

      const result = await databaseService.getTemperatureHistory(1);
      
      expect(result).toHaveLength(1);
      // Test that string numbers are converted to actual numbers
      expect(result[0].temperatura).toBe(25.5);
      expect(result[0].sensacao_termica).toBe(27.0);
      expect(result[0].umidade).toBe(60);
      expect(result[0].pressao).toBe(1013.25);
    });
  });

  describe('System Statistics', () => {
    it('should get system statistics', async () => {
      const mockPool = require('pg').Pool();
      const mockStats = {
        cidades_ativas: '3',
        temperaturas_24h: '50',
        alertas_24h: '2',
        temp_media_1h: '25.5',
        temp_min_1h: '20.0',
        temp_max_1h: '30.0'
      };
      
      mockPool.query.mockResolvedValueOnce({
        rows: [mockStats]
      });

      const result = await databaseService.getSystemStatistics();
      
      expect(result).toEqual(mockStats);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT')
      );
    });
  });
});

  describe('City Operations', () => {
    it('should get all cities successfully', async () => {
      // Mock cities data
      const mockCities = [
        { id: 1, nome: 'São Paulo', estado: 'SP', ativa: true },
        { id: 2, nome: 'Rio de Janeiro', estado: 'RJ', ativa: true }
      ];
      
      mockPool.query.mockResolvedValueOnce({ rows: mockCities });

      const result = await databaseService.getAllCities();
      
      expect(result).toEqual(mockCities);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM cidades')
      );
    });

    it('should get city by ID successfully', async () => {
      // Mock single city
      const mockCity = { id: 1, nome: 'São Paulo', estado: 'SP', ativa: true };
      mockPool.query.mockResolvedValueOnce({ rows: [mockCity] });

      const result = await databaseService.getCityById(1);
      
      expect(result).toEqual(mockCity);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM cidades WHERE id = $1'),
        [1]
      );
    });

    it('should return null when city not found', async () => {
      // Mock empty result
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await databaseService.getCityById(999);
      
      expect(result).toBeNull();
    });
  });

  describe('Temperature Operations', () => {
    it('should insert temperature record successfully', async () => {
      // Mock successful insertion
      const mockResult = { 
        rows: [{ id: 1, cidade_id: 1, temperatura: 25.5 }] 
      };
      mockPool.query.mockResolvedValueOnce(mockResult);

      const temperatureData = {
        cidade_id: 1,
        temperatura: 25.5,
        sensacao_termica: 27.0,
        umidade: 60,
        pressao: 1013.25,
        descricao_tempo: 'Ensolarado'
      };

      const result = await databaseService.insertTemperature(temperatureData);
      
      expect(result).toBeDefined();
      expect(result.temperatura).toBe(25.5);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO temperaturas'),
        expect.arrayContaining([1, 25.5, 27.0, 60, 1013.25])
      );
    });

    it('should validate temperature range', async () => {
      const invalidTemperatureData = {
        cidade_id: 1,
        temperatura: -300, // Invalid temperature
        sensacao_termica: -300,
        umidade: 60,
        pressao: 1013.25,
        descricao_tempo: 'Teste'
      };

      expect(invalidTemperatureData.temperatura).not.toBeValidTemperature();
    });

    it('should get temperature history with correct parameters', async () => {
      // Mock temperature history
      const mockHistory = [
        { id: 1, temperatura: 25.5, data_hora: new Date() },
        { id: 2, temperatura: 24.0, data_hora: new Date() }
      ];
      mockPool.query.mockResolvedValueOnce({ rows: mockHistory });

      const result = await databaseService.getTemperatureHistory(1);
      
      expect(result).toHaveLength(2);
      expect(result[0].temperatura).toBe(25.5);
    });
  });

  describe('Query Execution', () => {
    it('should execute query with parameters', async () => {
      const mockResult = { rows: [{ count: 5 }] };
      mockPool.query.mockResolvedValueOnce(mockResult);

      const result = await databaseService.query(
        'SELECT COUNT(*) as count FROM temperaturas WHERE cidade_id = $1',
        [1]
      );

      expect(result).toEqual([{ count: 5 }]);
    });

    it('should handle query errors', async () => {
      const error = new Error('SQL Error');
      mockPool.query.mockRejectedValueOnce(error);

      await expect(
        databaseService.query('INVALID SQL')
      ).rejects.toThrow('SQL Error');
    });
  });

  describe('System Statistics', () => {
    it('should get system statistics successfully', async () => {
      const mockStats = {
        cidades_ativas: 3,
        temperaturas_24h: 50,
        alertas_24h: 2,
        temp_media_1h: 25.5,
        temp_min_1h: 20.0,
        temp_max_1h: 30.0
      };
      
      mockPool.query.mockResolvedValueOnce({ rows: [mockStats] });

      const result = await databaseService.getSystemStatistics();
      
      expect(result).toEqual(mockStats);
      expect(result.cidades_ativas).toBe(3);
      expect(result.temp_media_1h).toBeValidTemperature();
    });
  });
});
