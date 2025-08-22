/**
 * Temperatures Routes
 * Sistema de Monitoramento de Temperatura
 * Subagente: Backend Developer (Node.js, Express, TypeScript)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { databaseService } from '../services/database.service';
import { redisService } from '../services/redis.service';
import { openWeatherService } from '../services/openweather.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/v1/temperaturas/atuais
 * @desc Obter temperaturas atuais de todas as cidades
 * @access Public
 */
router.get('/atuais', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Buscando temperaturas atuais de todas as cidades');

    // Verificar cache primeiro
    const cacheKey = 'temperaturas:atuais:all';
    const cachedTemperatures = await redisService.get(cacheKey);
    
    if (cachedTemperatures) {
      logger.debug('Retornando temperaturas atuais do cache');
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedTemperatures),
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Buscar temperaturas atuais do banco
    const currentTemperatures = await databaseService.getCurrentTemperatures();

    // Verificar se dados são recentes (menos de 10 minutos)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const hasRecentData = currentTemperatures.some(temp => 
      temp.data_hora && new Date(temp.data_hora) > tenMinutesAgo
    );

    // Se não há dados recentes (ou nenhum dado), coletar da API
    if (currentTemperatures.length === 0 || !hasRecentData) {
      logger.info(`${hasRecentData ? 'Dados desatualizados' : 'Sem dados'}, coletando da API OpenWeather`);
      
      const cities = await databaseService.getCidades();
      const apiTemperatures = [];

      for (const city of cities) {
        try {
          logger.debug(`Coletando dados da API para ${city.nome}`);
          const weatherData = await openWeatherService.getCurrentWeather(city.openweather_id);
          
          // Inserir no banco de dados
          await databaseService.insertTemperature({
            cidade_id: city.id,
            temperatura: weatherData.main.temp,
            sensacao_termica: weatherData.main.feels_like,
            umidade: weatherData.main.humidity,
            pressao: weatherData.main.pressure,
            descricao_tempo: weatherData.weather[0]?.description || '',
            velocidade_vento: weatherData.wind?.speed || 0,
            direcao_vento: weatherData.wind?.deg || 0,
            fonte: 'OpenWeather API'
          });

          // Padronizar formato de resposta
          apiTemperatures.push({
            id: Date.now() + city.id, // ID temporário
            cidade_id: city.id,
            cidade_nome: city.nome,
            estado: city.estado,
            temperatura: weatherData.main.temp,
            sensacao_termica: weatherData.main.feels_like,
            umidade: weatherData.main.humidity,
            pressao: weatherData.main.pressure,
            velocidade_vento: weatherData.wind?.speed || 0,
            direcao_vento: weatherData.wind?.deg || 0,
            descricao_tempo: weatherData.weather[0]?.description || '',
            data_hora: new Date().toISOString(),
            fonte: 'OpenWeather API'
          });

          logger.info(`Dados coletados com sucesso para ${city.nome}: ${weatherData.main.temp}°C`);

        } catch (error) {
          logger.error(`Erro ao coletar dados da cidade ${city.nome}:`, error);
        }
      }

      // Cache por 5 minutos
      await redisService.set(cacheKey, JSON.stringify(apiTemperatures), 300);

      logger.info(`Coleta da API finalizada: ${apiTemperatures.length} cidades atualizadas`);

      return res.status(200).json({
        success: true,
        data: apiTemperatures,
        cached: false,
        fonte: 'api_openweather',
        timestamp: new Date().toISOString()
      });
    }

    // Cache as temperaturas do banco por 5 minutos
    await redisService.set(cacheKey, JSON.stringify(currentTemperatures), 300);

    logger.info(`${currentTemperatures.length} temperaturas atuais encontradas`);

    res.status(200).json({
      success: true,
      data: currentTemperatures,
      cached: false,
      fonte: 'banco_dados',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao buscar temperaturas atuais:', error);
    next(error);
  }
});

/**
 * @route GET /api/v1/temperaturas/cidade/:id
 * @desc Obter histórico de temperaturas de uma cidade
 * @access Public
 */
router.get('/cidade/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cityId = parseInt(req.params.id);

    if (isNaN(cityId) || cityId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID da cidade inválido'
      });
    }

    // Parâmetros de consulta
    const {
      periodo = '24h',
      limit = '100'
    } = req.query;

    const limitNumber = parseInt(limit as string) || 100;
    
    if (limitNumber > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Limite não pode exceder 1000 registros'
      });
    }

    logger.info(`Buscando histórico de temperaturas da cidade ${cityId}, período: ${periodo}`);

    // Verificar se a cidade existe
    const city = await databaseService.getCidadeById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        error: 'Cidade não encontrada'
      });
    }

    // Calcular intervalo de tempo baseado no período
    let startDate: Date;
    const endDate = new Date();

    switch (periodo) {
      case '6h':
        startDate = new Date(endDate.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '12h':
        startDate = new Date(endDate.getTime() - 12 * 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    }

    // Verificar cache
    const cacheKey = `temperaturas:historico:${cityId}:${periodo}:${limitNumber}`;
    const cachedHistory = await redisService.get(cacheKey);
    
    if (cachedHistory) {
      logger.debug(`Retornando histórico do cache para cidade ${cityId}`);
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedHistory),
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Buscar histórico do banco
    const temperatureHistory = await databaseService.getTemperatureHistory(
      cityId,
      startDate,
      endDate,
      limitNumber
    );

    // Calcular estatísticas
    const statistics = temperatureHistory.length > 0 ? {
      total_registros: temperatureHistory.length,
      temperatura_media: Math.round((temperatureHistory.reduce((sum, temp) => sum + temp.temperatura, 0) / temperatureHistory.length) * 100) / 100,
      temperatura_minima: Math.min(...temperatureHistory.map(t => t.temperatura)),
      temperatura_maxima: Math.max(...temperatureHistory.map(t => t.temperatura)),
      periodo_inicio: startDate.toISOString(),
      periodo_fim: endDate.toISOString()
    } : null;

    const responseData = {
      city: {
        id: city.id,
        nome: city.nome,
        estado: city.estado
      },
      periodo,
      limit: limitNumber,
      statistics,
      temperatures: temperatureHistory
    };

    // Cache por 10 minutos
    await redisService.set(cacheKey, JSON.stringify(responseData), 600);

    logger.info(`Histórico de ${temperatureHistory.length} temperaturas encontrado para ${city.nome}`);

    res.status(200).json({
      success: true,
      data: responseData,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao buscar histórico de temperaturas:', error);
    next(error);
  }
});

/**
 * @route POST /api/v1/temperaturas/coletar-agora
 * @desc Força a coleta imediata de temperaturas da API OpenWeather
 * @access Public
 */
router.post('/coletar-agora', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Iniciando coleta imediata forçada de temperaturas');

    // Limpar cache primeiro para forçar dados frescos
    await redisService.del('temperaturas:atuais:all');

    const cities = await databaseService.getCidades();
    const results = {
      sucessos: 0,
      erros: 0,
      detalhes: [] as Array<{cidade: string, status: string, temperatura?: number, erro?: string}>
    };

    for (const city of cities) {
      try {
        logger.debug(`Forçando coleta para ${city.nome}`);
        
        const weatherData = await openWeatherService.getCurrentWeather(city.openweather_id);
        
        // Inserir no banco de dados
        await databaseService.insertTemperature({
          cidade_id: city.id,
          temperatura: weatherData.main.temp,
          sensacao_termica: weatherData.main.feels_like,
          umidade: weatherData.main.humidity,
          pressao: weatherData.main.pressure,
          descricao_tempo: weatherData.weather[0]?.description || '',
          velocidade_vento: weatherData.wind?.speed || 0,
          direcao_vento: weatherData.wind?.deg || 0,
          fonte: 'OpenWeather API (Coleta Forçada)'
        });

        results.sucessos++;
        results.detalhes.push({
          cidade: city.nome,
          status: 'sucesso',
          temperatura: weatherData.main.temp
        });

        logger.info(`Coleta forçada bem-sucedida para ${city.nome}: ${weatherData.main.temp}°C`);

      } catch (error) {
        results.erros++;
        results.detalhes.push({
          cidade: city.nome,
          status: 'erro',
          erro: (error as Error).message
        });

        logger.error(`Erro na coleta forçada para ${city.nome}:`, error);
      }
    }

    // Limpar caches relacionados para forçar refresh
    for (const city of cities) {
      const cachePattern = `temperaturas:historico:${city.id}:*`;
      await redisService.clearPattern(cachePattern);
    }

    logger.info(`Coleta forçada finalizada: ${results.sucessos} sucessos, ${results.erros} erros`);

    res.status(200).json({
      success: true,
      message: `Coleta forçada finalizada: ${results.sucessos} sucessos, ${results.erros} erros`,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro na coleta forçada de temperaturas:', error);
    next(error);
  }
});

/**
 * @route POST /api/v1/temperaturas/coletar
 * @desc Coletar temperaturas de todas as cidades da API OpenWeather
 * @access Private (seria protegido por autenticação em produção)
 */
router.post('/coletar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Iniciando coleta manual de temperaturas');

    const cities = await databaseService.getCidades();
    const results = {
      sucessos: 0,
      erros: 0,
      detalhes: [] as Array<{cidade: string, status: string, erro?: string}>
    };

    for (const city of cities) {
      try {
        logger.debug(`Coletando dados para ${city.nome}`);
        
        const weatherData = await openWeatherService.getCurrentWeather(city.openweather_id);
        
        // Inserir no banco de dados usando a function do PostgreSQL
        await databaseService.insertTemperature({
          cidade_id: city.id,
          temperatura: weatherData.main.temp,
          sensacao_termica: weatherData.main.feels_like,
          umidade: weatherData.main.humidity,
          pressao: weatherData.main.pressure,
          descricao_tempo: weatherData.weather[0]?.description || '',
          velocidade_vento: weatherData.wind?.speed || 0,
          direcao_vento: weatherData.wind?.deg || 0,
          fonte: 'OpenWeather API'
        });

        results.sucessos++;
        results.detalhes.push({
          cidade: city.nome,
          status: 'sucesso'
        });

        logger.debug(`Dados coletados com sucesso para ${city.nome}`);

      } catch (error) {
        results.erros++;
        results.detalhes.push({
          cidade: city.nome,
          status: 'erro',
          erro: (error as Error).message
        });

        logger.error(`Erro ao coletar dados para ${city.nome}:`, error);
      }
    }

    // Limpar caches relacionados
    await redisService.del('temperaturas:atuais:all');
    
    // Limpar caches de histórico de cada cidade
    for (const city of cities) {
      const cachePattern = `temperaturas:historico:${city.id}:*`;
      await redisService.clearPattern(cachePattern);
    }

    logger.info(`Coleta finalizada: ${results.sucessos} sucessos, ${results.erros} erros`);

    res.status(200).json({
      success: true,
      message: `Coleta finalizada: ${results.sucessos} sucessos, ${results.erros} erros`,
      data: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro na coleta de temperaturas:', error);
    next(error);
  }
});

/**
 * @route GET /api/v1/temperaturas/estatisticas
 * @desc Obter estatísticas gerais do sistema
 * @access Public
 */
router.get('/estatisticas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Buscando estatísticas do sistema');

    // Verificar cache primeiro
    const cacheKey = 'temperaturas:estatisticas';
    const cachedStats = await redisService.get(cacheKey);
    
    if (cachedStats) {
      logger.debug('Retornando estatísticas do cache');
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedStats),
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Buscar estatísticas do banco
    const statistics = await databaseService.getSystemStatistics();

    // Cache por 15 minutos
    await redisService.set(cacheKey, JSON.stringify(statistics), 900);

    logger.info('Estatísticas do sistema obtidas com sucesso');

    res.status(200).json({
      success: true,
      data: statistics,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error);
    next(error);
  }
});

/**
 * @route GET /api/v1/temperaturas/historico/:id?
 * @desc Obter histórico de temperaturas para gráficos
 * @access Public
 */
router.get('/historico/:id?', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cityId = req.params.id ? parseInt(req.params.id) : null;
    
    if (cityId && (isNaN(cityId) || cityId <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'ID da cidade inválido'
      });
    }

    // Parâmetros de consulta
    const {
      periodo = '24h',
      limit = '100'
    } = req.query;

    const limitNumber = parseInt(limit as string) || 100;
    
    if (limitNumber > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Limite não pode exceder 1000 registros'
      });
    }

    logger.info(`Buscando histórico de temperaturas ${cityId ? `da cidade ${cityId}` : 'de todas as cidades'}, período: ${periodo}`);

    // Se ID da cidade fornecido, verificar se existe
    if (cityId) {
      const city = await databaseService.getCidadeById(cityId);
      if (!city) {
        return res.status(404).json({
          success: false,
          error: 'Cidade não encontrada'
        });
      }
    }

    // Calcular intervalo de tempo baseado no período
    let startDate: Date;
    const endDate = new Date();

    switch (periodo) {
      case '6h':
        startDate = new Date(endDate.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '12h':
        startDate = new Date(endDate.getTime() - 12 * 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    }

    // Verificar cache
    const cacheKey = `temperaturas:historico:${cityId || 'all'}:${periodo}:${limitNumber}`;
    const cachedHistory = await redisService.get(cacheKey);
    
    if (cachedHistory) {
      logger.debug(`Retornando histórico do cache`);
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedHistory),
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Buscar histórico do banco
    let temperatureHistory;
    if (cityId) {
      temperatureHistory = await databaseService.getTemperatureHistory(
        cityId,
        startDate,
        endDate,
        limitNumber
      );
    } else {
      // Para todas as cidades, buscar cidades ativas e depois histórico
      const cities = await databaseService.getCidades();
      temperatureHistory = [];
      
      for (const city of cities.slice(0, 5)) { // Limitar a 5 cidades para performance
        const cityHistory = await databaseService.getTemperatureHistory(
          city.id,
          startDate,
          endDate,
          Math.floor(limitNumber / 5) // Dividir limite entre cidades
        );
        
        // Adicionar nome da cidade aos registros
        const enrichedHistory = cityHistory.map(temp => ({
          ...temp,
          cidade_nome: city.nome,
          estado: city.estado
        }));
        
        temperatureHistory.push(...enrichedHistory);
      }
      
      // Ordenar por data_hora
      temperatureHistory.sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
      
      // Limitar resultado final
      temperatureHistory = temperatureHistory.slice(0, limitNumber);
    }

    // Cache por 10 minutos
    await redisService.set(cacheKey, JSON.stringify(temperatureHistory), 600);

    logger.info(`Histórico de ${temperatureHistory.length} temperaturas encontrado`);

    res.status(200).json({
      success: true,
      data: temperatureHistory,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao buscar histórico de temperaturas:', error);
    next(error);
  }
});

export default router;
