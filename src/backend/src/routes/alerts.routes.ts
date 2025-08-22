/**
 * Alerts Routes
 * Sistema de Monitoramento de Temperatura
 * Subagente: Backend Developer (Node.js, Express, TypeScript)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { databaseService } from '../services/database.service';
import { redisService } from '../services/redis.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/v1/alertas/recentes
 * @desc Obter alertas disparados recentes
 * @access Public
 */
router.get('/recentes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '50' } = req.query;
    const limitNumber = Math.min(parseInt(limit as string) || 50, 200);

    logger.info(`Buscando ${limitNumber} alertas recentes`);

    // Verificar cache primeiro
    const cacheKey = `alertas:recentes:${limitNumber}`;
    const cachedAlerts = await redisService.get(cacheKey);
    
    if (cachedAlerts) {
      logger.debug('Retornando alertas recentes do cache');
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedAlerts),
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Buscar alertas recentes do banco
    const recentAlerts = await databaseService.getRecentAlerts(limitNumber);

    // Enriquecer dados com informações das cidades
    const enrichedAlerts = [];
    for (const alert of recentAlerts) {
      // Buscar dados da temperatura para obter cidade
      const temperature = await databaseService.queryOne<{
        cidade_id: number;
        cidade_nome: string;
        estado: string;
        temperatura: number;
        data_hora: Date;
      }>(`
        SELECT 
          t.cidade_id,
          c.nome as cidade_nome,
          c.estado,
          t.temperatura,
          t.data_hora
        FROM temperaturas t
        JOIN cidades c ON t.cidade_id = c.id
        WHERE t.id = $1
      `, [alert.temperatura_id]);

      enrichedAlerts.push({
        ...alert,
        cidade: temperature ? {
          id: temperature.cidade_id,
          nome: temperature.cidade_nome,
          estado: temperature.estado
        } : null,
        temperatura_registro: temperature?.temperatura
      });
    }

    // Cache por 5 minutos
    await redisService.set(cacheKey, JSON.stringify(enrichedAlerts), 300);

    logger.info(`${enrichedAlerts.length} alertas recentes encontrados`);

    res.status(200).json({
      success: true,
      data: enrichedAlerts,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao buscar alertas recentes:', error);
    next(error);
  }
});

/**
 * @route GET /api/v1/alertas/configs
 * @desc Obter configurações de alertas de todas as cidades
 * @access Public
 */
router.get('/configs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Buscando configurações de alertas');

    // Verificar cache primeiro
    const cacheKey = 'alertas:configs:all';
    const cachedConfigs = await redisService.get(cacheKey);
    
    if (cachedConfigs) {
      logger.debug('Retornando configurações de alertas do cache');
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedConfigs),
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Buscar configurações de todas as cidades
    const allConfigs = await databaseService.query<{
      id: number;
      cidade_id: number;
      cidade_nome: string;
      estado: string;
      tipo_alerta: string;
      valor_minimo: number | null;
      valor_maximo: number | null;
      ativo: boolean;
      email_notificacao: string | null;
      webhook_url: string | null;
      data_criacao: Date;
    }>(`
      SELECT 
        ac.id,
        ac.cidade_id,
        c.nome as cidade_nome,
        c.estado,
        ac.tipo_alerta,
        ac.valor_minimo,
        ac.valor_maximo,
        ac.ativo,
        ac.email_notificacao,
        ac.webhook_url,
        ac.data_criacao
      FROM alertas_config ac
      JOIN cidades c ON ac.cidade_id = c.id
      WHERE ac.ativo = true
      ORDER BY c.nome, ac.tipo_alerta
    `);

    // Agrupar por cidade
    const configsByCity: { [key: number]: any } = {};
    allConfigs.forEach(config => {
      if (!configsByCity[config.cidade_id]) {
        configsByCity[config.cidade_id] = {
          cidade: {
            id: config.cidade_id,
            nome: config.cidade_nome,
            estado: config.estado
          },
          alertas: []
        };
      }
      
      configsByCity[config.cidade_id].alertas.push({
        id: config.id,
        tipo_alerta: config.tipo_alerta,
        valor_minimo: config.valor_minimo,
        valor_maximo: config.valor_maximo,
        ativo: config.ativo,
        email_notificacao: config.email_notificacao,
        webhook_url: config.webhook_url,
        data_criacao: config.data_criacao
      });
    });

    const result = Object.values(configsByCity);

    // Cache por 30 minutos
    await redisService.set(cacheKey, JSON.stringify(result), 1800);

    logger.info(`Configurações de alertas para ${result.length} cidades encontradas`);

    res.status(200).json({
      success: true,
      data: result,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao buscar configurações de alertas:', error);
    next(error);
  }
});

/**
 * @route GET /api/v1/alertas/configs/cidade/:id
 * @desc Obter configurações de alertas de uma cidade específica
 * @access Public
 */
router.get('/configs/cidade/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cidadeId = parseInt(req.params.id);

    if (isNaN(cidadeId) || cidadeId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID da cidade inválido'
      });
    }

    logger.info(`Buscando configurações de alertas para cidade ${cidadeId}`);

    // Verificar se a cidade existe
    const city = await databaseService.getCidadeById(cidadeId);
    if (!city) {
      return res.status(404).json({
        success: false,
        error: 'Cidade não encontrada'
      });
    }

    // Verificar cache primeiro
    const cacheKey = `alertas:configs:cidade:${cidadeId}`;
    const cachedConfigs = await redisService.get(cacheKey);
    
    if (cachedConfigs) {
      logger.debug(`Retornando configurações de alertas da cidade ${cidadeId} do cache`);
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedConfigs),
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Buscar configurações da cidade
    const alertConfigs = await databaseService.getAlertConfigsByCidade(cidadeId);

    const result = {
      cidade: {
        id: city.id,
        nome: city.nome,
        estado: city.estado
      },
      alertas: alertConfigs
    };

    // Cache por 30 minutos
    await redisService.set(cacheKey, JSON.stringify(result), 1800);

    logger.info(`${alertConfigs.length} configurações de alertas encontradas para ${city.nome}`);

    res.status(200).json({
      success: true,
      data: result,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao buscar configurações de alertas da cidade:', error);
    next(error);
  }
});

/**
 * @route GET /api/v1/alertas/estatisticas
 * @desc Obter estatísticas dos alertas
 * @access Public
 */
router.get('/estatisticas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Buscando estatísticas de alertas');

    // Verificar cache primeiro
    const cacheKey = 'alertas:estatisticas';
    const cachedStats = await redisService.get(cacheKey);
    
    if (cachedStats) {
      logger.debug('Retornando estatísticas de alertas do cache');
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedStats),
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Buscar estatísticas
    const stats = await databaseService.queryOne<{
      total_alertas_24h: number;
      total_alertas_7d: number;
      total_alertas_30d: number;
      alertas_por_tipo: any;
      alertas_por_cidade: any;
      ultimo_alerta: Date | null;
    }>(`
      SELECT 
        (SELECT COUNT(*) FROM alertas_disparados WHERE data_hora >= NOW() - INTERVAL '24 hours')::integer as total_alertas_24h,
        (SELECT COUNT(*) FROM alertas_disparados WHERE data_hora >= NOW() - INTERVAL '7 days')::integer as total_alertas_7d,
        (SELECT COUNT(*) FROM alertas_disparados WHERE data_hora >= NOW() - INTERVAL '30 days')::integer as total_alertas_30d,
        (SELECT json_agg(row_to_json(t)) FROM (
          SELECT tipo_alerta, COUNT(*)::integer as quantidade
          FROM alertas_disparados 
          WHERE data_hora >= NOW() - INTERVAL '24 hours'
          GROUP BY tipo_alerta
          ORDER BY quantidade DESC
        ) t) as alertas_por_tipo,
        (SELECT json_agg(row_to_json(c)) FROM (
          SELECT c.nome as cidade, c.estado, COUNT(ad.*)::integer as quantidade
          FROM alertas_disparados ad
          JOIN temperaturas t ON ad.temperatura_id = t.id
          JOIN cidades c ON t.cidade_id = c.id
          WHERE ad.data_hora >= NOW() - INTERVAL '24 hours'
          GROUP BY c.id, c.nome, c.estado
          ORDER BY quantidade DESC
        ) c) as alertas_por_cidade,
        (SELECT MAX(data_hora) FROM alertas_disparados) as ultimo_alerta
    `);

    const result = {
      periodo_24h: stats?.total_alertas_24h || 0,
      periodo_7d: stats?.total_alertas_7d || 0,
      periodo_30d: stats?.total_alertas_30d || 0,
      por_tipo: stats?.alertas_por_tipo || [],
      por_cidade: stats?.alertas_por_cidade || [],
      ultimo_alerta: stats?.ultimo_alerta,
      timestamp: new Date().toISOString()
    };

    // Cache por 10 minutos
    await redisService.set(cacheKey, JSON.stringify(result), 600);

    logger.info('Estatísticas de alertas obtidas com sucesso');

    res.status(200).json({
      success: true,
      data: result,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao buscar estatísticas de alertas:', error);
    next(error);
  }
});

export default router;
