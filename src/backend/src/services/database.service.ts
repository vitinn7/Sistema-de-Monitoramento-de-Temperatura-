/**
 * Database Service
 * Sistema de Monitoramento de Temperatura
 * Subagente: Backend Developer (Node.js, Express, TypeScript)
 */

import { Pool, PoolClient, PoolConfig } from 'pg';
import { config } from '../config/environment';
import { logger, logDatabaseOperation, logError } from '../utils/logger';

export interface DatabaseTransaction {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface Cidade {
  id: number;
  nome: string;
  estado: string;
  pais: string;
  latitude: number;
  longitude: number;
  openweather_id: number;
  ativa: boolean;
  data_criacao: Date;
  data_atualizacao: Date;
}

export interface Temperatura {
  id: number;
  cidade_id: number;
  temperatura: number;
  sensacao_termica: number;
  umidade: number;
  pressao: number;
  velocidade_vento: number;
  direcao_vento: number;
  descricao_tempo: string;
  data_hora: Date;
  fonte: string;
}

export interface AlertaConfig {
  id: number;
  cidade_id: number;
  tipo_alerta: string;
  valor_minimo?: number;
  valor_maximo?: number;
  ativo: boolean;
  email_notificacao?: string;
  webhook_url?: string;
  data_criacao: Date;
}

export interface AlertaDisparado {
  id: number;
  temperatura_id: number;
  config_alerta_id: number;
  tipo_alerta: string;
  valor_disparador: number;
  valor_limite: number;
  mensagem?: string;
  data_hora: Date;
  notificado?: boolean;
  data_notificacao?: Date;
}

// Database Transaction Interface

export interface LogSistema {
  id: number;
  nivel: string;
  categoria: string;
  mensagem: string;
  detalhes?: object;
  timestamp: Date;
}

export class DatabaseService {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor() {
    const poolConfig: PoolConfig = {
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.username,
      password: config.database.password,
      ssl: config.database.ssl,
      max: config.database.maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    this.pool = new Pool(poolConfig);
    
    // Handle pool errors
    this.pool.on('error', (err) => {
      logError(new Error('Unexpected error on idle client'), { originalError: err.message });
    });

    // Handle pool connection events
    this.pool.on('connect', () => {
      logger.debug('New client connected to the database');
    });

    this.pool.on('remove', () => {
      logger.debug('Client removed from the database pool');
    });
  }

  /**
   * Initialize database connection and verify connectivity
   */
  async connect(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();

      const duration = Date.now() - startTime;
      
      this.isConnected = true;
      logDatabaseOperation('CONNECTION_TEST', 'system', duration);
      logger.info('Database connected successfully', {
        database: config.database.database,
        host: config.database.host,
        serverTime: result.rows[0].now
      });
    } catch (error) {
      this.isConnected = false;
      logError(new Error('Failed to connect to database'), { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logError(new Error('Error disconnecting from database'), { error: (error as Error).message });
    }
  }

  /**
   * Check if database is connected
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Execute a query
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const startTime = Date.now();
    
    try {
      const result = await this.pool.query(sql, params);
      const duration = Date.now() - startTime;
      
      logDatabaseOperation('QUERY', 'unknown', duration, result.rowCount || 0);
      
      return result.rows as T[];
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(new Error('Database query failed'), {
        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
        params,
        duration,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Execute a query with a single row result
   */
  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Begin a database transaction
   */
  async beginTransaction(): Promise<DatabaseTransaction> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      return {
        query: async <T = any>(sql: string, params?: any[]): Promise<T[]> => {
          const startTime = Date.now();
          
          try {
            const result = await client.query(sql, params);
            const duration = Date.now() - startTime;
            
            logDatabaseOperation('TRANSACTION_QUERY', 'unknown', duration, result.rowCount || 0);
            
            return result.rows as T[];
          } catch (error) {
            const duration = Date.now() - startTime;
            logError(new Error('Transaction query failed'), {
              sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
              params,
              duration,
              error: (error as Error).message
            });
            throw error;
          }
        },
        
        commit: async (): Promise<void> => {
          try {
            await client.query('COMMIT');
            logger.debug('Transaction committed successfully');
          } finally {
            client.release();
          }
        },
        
        rollback: async (): Promise<void> => {
          try {
            await client.query('ROLLBACK');
            logger.debug('Transaction rolled back successfully');
          } finally {
            client.release();
          }
        }
      };
    } catch (error) {
      client.release();
      throw error;
    }
  }

  // ============================================================================
  // CIDADE OPERATIONS
  // ============================================================================

  /**
   * Get all active cities
   */
  async getCidades(): Promise<Cidade[]> {
    const sql = `
      SELECT id, nome, estado, pais, latitude, longitude, openweather_id,
             ativa, data_criacao, data_atualizacao
      FROM cidades 
      WHERE ativa = true 
      ORDER BY nome
    `;
    
    return await this.query<Cidade>(sql);
  }

  /**
   * Get city by ID
   */
  async getCidadeById(id: number): Promise<Cidade | null> {
    const sql = `
      SELECT id, nome, estado, pais, latitude, longitude, openweather_id,
             ativa, data_criacao, data_atualizacao
      FROM cidades 
      WHERE id = $1
    `;
    
    return await this.queryOne<Cidade>(sql, [id]);
  }

  /**
   * Get city by OpenWeather ID
   */
  async getCidadeByOpenWeatherId(openweatherId: number): Promise<Cidade | null> {
    const sql = `
      SELECT id, nome, estado, pais, latitude, longitude, openweather_id,
             ativa, data_criacao, data_atualizacao
      FROM cidades 
      WHERE openweather_id = $1
    `;
    
    return await this.queryOne<Cidade>(sql, [openweatherId]);
  }

  // ============================================================================
  // TEMPERATURE OPERATIONS
  // ============================================================================

  /**
   * Insert new temperature reading using stored procedure
   */
  async insertTemperatura(
    cidadeId: number,
    temperatura: number,
    sensacaoTermica: number,
    umidade: number,
    pressao: number,
    descricao: string
  ): Promise<number> {
    const sql = `
      SELECT inserir_temperatura_com_alerta($1, $2, $3, $4, $5, $6) as temperatura_id
    `;
    
    const result = await this.queryOne<{ temperatura_id: number }>(sql, [
      cidadeId,
      temperatura,
      sensacaoTermica,
      umidade,
      pressao,
      descricao
    ]);

    if (!result) {
      throw new Error('Failed to insert temperature data');
    }

    return result.temperatura_id;
  }

  /**
   * Get latest temperatures for all cities
   */
  async getLatestTemperatures(): Promise<Temperatura[]> {
    const sql = `
      SELECT t.id, t.cidade_id, t.temperatura, t.sensacao_termica, 
             t.umidade, t.pressao, t.descricao, t.data_hora, t.data_criacao
      FROM temperaturas t
      INNER JOIN temperatura_atual_view v ON t.id = v.id
      ORDER BY t.data_hora DESC
    `;
    
    return await this.query<Temperatura>(sql);
  }

  /**
   * Get temperature history for a city
   */
  async getTemperatureHistory(
    cidadeId: number,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<Temperatura[]> {
    let sql = `
      SELECT 
        t.id, 
        t.cidade_id, 
        t.temperatura, 
        t.sensacao_termica, 
        t.umidade, 
        t.pressao, 
        t.velocidade_vento,
        t.direcao_vento,
        t.descricao_tempo,
        t.data_hora,
        t.data_hora as data_criacao,
        c.nome as cidade_nome,
        c.estado
      FROM temperaturas t
      JOIN cidades c ON t.cidade_id = c.id
      WHERE t.cidade_id = $1
    `;
    
    const params: any[] = [cidadeId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      sql += ` AND t.data_hora >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      sql += ` AND t.data_hora <= $${paramCount}`;
      params.push(endDate);
    }

    sql += ` ORDER BY t.data_hora DESC LIMIT $${++paramCount}`;
    params.push(limit);

    const results = await this.query<any>(sql, params);
    
    // Convert string numbers to actual numbers for better frontend handling
    return results.map(row => ({
      ...row,
      temperatura: parseFloat(row.temperatura) || 0,
      sensacao_termica: row.sensacao_termica ? parseFloat(row.sensacao_termica) : 0,
      umidade: row.umidade ? parseInt(row.umidade) : 0,
      pressao: row.pressao ? parseFloat(row.pressao) : 0,
      velocidade_vento: row.velocidade_vento ? parseFloat(row.velocidade_vento) : 0,
      direcao_vento: row.direcao_vento ? parseInt(row.direcao_vento) : 0
    })) as Temperatura[];
  }

  // ============================================================================
  // ALERT OPERATIONS
  // ============================================================================

  /**
   * Get alert configurations for a city
   */
  async getAlertConfigsByCidade(cidadeId: number): Promise<AlertaConfig[]> {
    const sql = `
      SELECT id, cidade_id, tipo_alerta, valor_minimo, valor_maximo, 
             ativo, email_notificacao, webhook_url, data_criacao
      FROM alertas_config 
      WHERE cidade_id = $1 AND ativo = true
    `;
    
    return await this.query<AlertaConfig>(sql, [cidadeId]);
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit: number = 50): Promise<AlertaDisparado[]> {
    const sql = `
      SELECT id, temperatura_id, config_alerta_id, tipo_alerta, 
             valor_disparador, valor_limite, mensagem, data_hora,
             notificado, data_notificacao
      FROM alertas_disparados 
      ORDER BY data_hora DESC 
      LIMIT $1
    `;
    
    return await this.query<AlertaDisparado>(sql, [limit]);
  }

  // ============================================================================
  // SYSTEM OPERATIONS
  // ============================================================================

  /**
   * Clean old temperature data using stored procedure
   */
  async cleanupOldData(daysToKeep: number = 30): Promise<number> {
    const sql = `SELECT cleanup_old_temperatures($1) as deleted_count`;
    
    const result = await this.queryOne<{ deleted_count: number }>(sql, [daysToKeep]);
    
    if (!result) {
      throw new Error('Failed to cleanup old data');
    }

    logger.info('Cleaned up old temperature data', {
      deletedRecords: result.deleted_count,
      daysKept: daysToKeep
    });

    return result.deleted_count;
  }

  /**
   * Log system event
   */
  async logSystemEvent(
    nivel: string,
    categoria: string,
    mensagem: string,
    detalhes?: object
  ): Promise<void> {
    const sql = `
      INSERT INTO logs_sistema (nivel, categoria, mensagem, detalhes)
      VALUES ($1, $2, $3, $4)
    `;
    
    await this.query(sql, [nivel, categoria, mensagem, detalhes ? JSON.stringify(detalhes) : null]);
  }

  /**
   * Get database health statistics
   */
  async getHealthStats(): Promise<{
    totalConnections: number;
    activeConnections: number;
    totalCities: number;
    activeCities: number;
    totalTemperatureReadings: number;
    latestReadingTime: Date | null;
  }> {
    const sql = `
      SELECT 
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as total_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as active_connections,
        (SELECT count(*) FROM cidades) as total_cities,
        (SELECT count(*) FROM cidades WHERE ativa = true) as active_cities,
        (SELECT count(*) FROM temperaturas) as total_temperature_readings,
        (SELECT MAX(data_hora) FROM temperaturas) as latest_reading_time
    `;
    
    const result = await this.queryOne<any>(sql);
    
    return {
      totalConnections: parseInt(result?.total_connections || '0'),
      activeConnections: parseInt(result?.active_connections || '0'),
      totalCities: parseInt(result?.total_cities || '0'),
      activeCities: parseInt(result?.active_cities || '0'),
      totalTemperatureReadings: parseInt(result?.total_temperature_readings || '0'),
      latestReadingTime: result?.latest_reading_time || null
    };
  }

  /**
   * Get current temperatures for all cities
   */
  async getCurrentTemperatures(): Promise<any[]> {
    try {
      const query = `
        SELECT DISTINCT ON (cidade_id) 
          t.id, t.cidade_id, c.nome as cidade_nome, c.estado,
          t.temperatura, t.sensacao_termica, t.umidade, t.pressao,
          t.velocidade_vento, t.direcao_vento, t.descricao_tempo,
          t.data_hora, t.fonte
        FROM temperaturas t
        INNER JOIN cidades c ON c.id = t.cidade_id  
        WHERE c.ativa = true
        ORDER BY cidade_id, t.data_hora DESC;
      `;

      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Erro ao buscar temperaturas atuais:', error);
      throw error;
    }
  }

  /**
   * Insert temperature (modernized version)
   */
  async insertTemperature(data: {
    cidade_id: number;
    temperatura: number;
    sensacao_termica?: number;
    umidade?: number;
    pressao?: number;
    velocidade_vento?: number;
    direcao_vento?: number;
    descricao_tempo?: string;
    fonte?: string;
  }): Promise<void> {
    try {
      const sql = `
        INSERT INTO temperaturas (
          cidade_id, temperatura, sensacao_termica, umidade, pressao,
          velocidade_vento, direcao_vento, descricao_tempo, fonte, data_hora
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `;

      await this.query(sql, [
        data.cidade_id,
        data.temperatura,
        data.sensacao_termica || null,
        data.umidade || null,
        data.pressao || null,
        data.velocidade_vento || null,
        data.direcao_vento || null,
        data.descricao_tempo || null,
        data.fonte || 'API'
      ]);

      logger.debug(`Temperatura inserida para cidade ${data.cidade_id}: ${data.temperatura}°C`);
    } catch (error) {
      logger.error('Erro ao inserir temperatura:', error);
      throw error;
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStatistics(): Promise<any> {
    try {
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM cidades WHERE ativa = true) as cidades_ativas,
          (SELECT COUNT(*) FROM temperaturas WHERE data_hora >= NOW() - INTERVAL '24 hours') as temperaturas_24h,
          (SELECT COUNT(*) FROM alertas_disparados WHERE data_hora >= NOW() - INTERVAL '24 hours') as alertas_24h,
          (SELECT AVG(temperatura) FROM temperaturas WHERE data_hora >= NOW() - INTERVAL '1 hour') as temp_media_1h,
          (SELECT MIN(temperatura) FROM temperaturas WHERE data_hora >= NOW() - INTERVAL '1 hour') as temp_min_1h,
          (SELECT MAX(temperatura) FROM temperaturas WHERE data_hora >= NOW() - INTERVAL '1 hour') as temp_max_1h,
          0 as errors_1h,
          NOW() as timestamp;
      `;

      const result = await this.pool.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error('Erro ao buscar estatísticas do sistema:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
