/**
 * Cities Routes
 * Sistema de Monitoramento de Temperatura
 * Subagente: Backend Developer (Node.js, Express, TypeScript)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { databaseService } from '../services/database.service';
import { redisService } from '../services/redis.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route GET /api/v1/cidades
 * @desc Get all active cities
 * @access Public
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check cache first
    const cachedCities = await redisService.getCachedCitiesList();
    
    if (cachedCities) {
      logger.debug('Returning cached cities list');
      return res.status(200).json({
        success: true,
        data: cachedCities,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Get from database
    const cities = await databaseService.getCidades();
    
    // Cache for future requests
    await redisService.cacheCitiesList(cities, 3600); // Cache for 1 hour

    logger.info('Cities list retrieved successfully', { count: cities.length });

    res.status(200).json({
      success: true,
      data: cities,
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching cities', { error: (error as Error).message });
    next(error);
  }
});

/**
 * @route GET /api/v1/cidades/:id
 * @desc Get city by ID
 * @access Public
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cityId = parseInt(req.params.id);

    if (isNaN(cityId) || cityId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid city ID provided'
      });
    }

    const city = await databaseService.getCidadeById(cityId);

    if (!city) {
      return res.status(404).json({
        success: false,
        error: 'City not found'
      });
    }

    logger.info('City retrieved successfully', { 
      cityId, 
      cityName: city.nome 
    });

    res.status(200).json({
      success: true,
      data: city,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching city', { 
      cityId: req.params.id,
      error: (error as Error).message 
    });
    next(error);
  }
});

/**
 * @route GET /api/v1/cidades/:id/temperaturas
 * @desc Get temperature history for a city
 * @access Public
 */
router.get('/:id/temperaturas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cityId = parseInt(req.params.id);

    if (isNaN(cityId) || cityId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid city ID provided'
      });
    }

    // Parse query parameters
    const {
      startDate,
      endDate,
      limit = '100'
    } = req.query;

    const limitNumber = parseInt(limit as string) || 100;
    
    if (limitNumber > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Limit cannot exceed 1000 records'
      });
    }

    // Validate dates if provided
    let startDateTime: Date | undefined;
    let endDateTime: Date | undefined;

    if (startDate) {
      startDateTime = new Date(startDate as string);
      if (isNaN(startDateTime.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid start date format'
        });
      }
    }

    if (endDate) {
      endDateTime = new Date(endDate as string);
      if (isNaN(endDateTime.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid end date format'
        });
      }
    }

    // Verify city exists
    const city = await databaseService.getCidadeById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        error: 'City not found'
      });
    }

    // Get temperature history
    const temperatures = await databaseService.getTemperatureHistory(
      cityId,
      startDateTime,
      endDateTime,
      limitNumber
    );

    logger.info('Temperature history retrieved successfully', {
      cityId,
      cityName: city.nome,
      count: temperatures.length,
      startDate: startDateTime?.toISOString(),
      endDate: endDateTime?.toISOString(),
      limit: limitNumber
    });

    res.status(200).json({
      success: true,
      data: {
        city: {
          id: city.id,
          nome: city.nome,
          estado: city.estado
        },
        temperatures,
        pagination: {
          total: temperatures.length,
          limit: limitNumber,
          hasMore: temperatures.length === limitNumber
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching temperature history', { 
      cityId: req.params.id,
      error: (error as Error).message 
    });
    next(error);
  }
});

/**
 * @route GET /api/v1/cidades/:id/alertas
 * @desc Get alert configurations for a city
 * @access Public
 */
router.get('/:id/alertas', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cityId = parseInt(req.params.id);

    if (isNaN(cityId) || cityId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid city ID provided'
      });
    }

    // Verify city exists
    const city = await databaseService.getCidadeById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        error: 'City not found'
      });
    }

    // Check cache first
    const cachedAlerts = await redisService.getCachedAlertConfigs(cityId);
    
    if (cachedAlerts) {
      logger.debug('Returning cached alert configs', { cityId });
      return res.status(200).json({
        success: true,
        data: {
          city: {
            id: city.id,
            nome: city.nome,
            estado: city.estado
          },
          alertConfigs: cachedAlerts
        },
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Get from database
    const alertConfigs = await databaseService.getAlertConfigsByCidade(cityId);
    
    // Cache for future requests
    await redisService.cacheAlertConfigs(cityId, alertConfigs, 1800); // Cache for 30 minutes

    logger.info('Alert configurations retrieved successfully', {
      cityId,
      cityName: city.nome,
      count: alertConfigs.length
    });

    res.status(200).json({
      success: true,
      data: {
        city: {
          id: city.id,
          nome: city.nome,
          estado: city.estado
        },
        alertConfigs
      },
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching alert configurations', { 
      cityId: req.params.id,
      error: (error as Error).message 
    });
    next(error);
  }
});

export default router;
