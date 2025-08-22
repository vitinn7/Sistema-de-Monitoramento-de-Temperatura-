/**
 * Sistema de Monitoramento de Temperatura - Backend API
 * Subagente: Backend Developer (Node.js, Express, TypeScript)
 * Data: 19/08/2025
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import { logger } from './utils/logger';
import { databaseService } from './services/database.service';
import { redisService } from './services/redis.service';
import { openWeatherService } from './services/openweather.service';

// Import routes
import citiesRoutes from './routes/cities.routes';
import temperaturesRoutes from './routes/temperatures.routes';
import alertsRoutes from './routes/alerts.routes';

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Segurança básica
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS
    const corsOrigins = [
      config.security.corsOrigin || 'http://localhost:5173',
      'http://localhost:5173',  // Vite default port
      'http://localhost:3001',  // Alternative frontend port
      'http://localhost:3000',  // Same port as backend (for testing)
    ];

    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn(`CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: config.security.rateLimitMax || 100,
      message: {
        success: false,
        error: 'Muitas requisições, tente novamente em alguns minutos'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging das requisições
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined
      });
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'API de Monitoramento de Temperatura funcionando',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv,
        uptime: process.uptime()
      });
    });

    // API routes
    this.app.use('/api/v1/cidades', citiesRoutes);
    this.app.use('/api/v1/temperaturas', temperaturesRoutes);
    this.app.use('/api/v1/alertas', alertsRoutes);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Sistema de Monitoramento de Temperatura API',
        version: '1.0.0',
        documentation: '/api/docs',
        endpoints: {
          health: '/health',
          cidades: '/api/v1/cidades',
          temperaturas: '/api/v1/temperaturas',
          alertas: '/api/v1/alertas'
        },
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  private initializeErrorHandling(): void {
    // Error handler global
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Erro não tratado na aplicação:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        ip: req.ip
      });

      // Não vazar detalhes em produção
      const isProduction = config.nodeEnv === 'production';
      
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: isProduction ? 'Algo deu errado' : error.message,
        timestamp: new Date().toISOString(),
        ...(isProduction ? {} : { stack: error.stack })
      });
    });

    // Tratamento de promessas rejeitadas
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Promise rejeitada não tratada:', {
        reason: reason?.message || reason,
        stack: reason?.stack
      });
    });

    // Tratamento de exceções não capturadas
    process.on('uncaughtException', (error: Error) => {
      logger.error('Exceção não capturada:', {
        error: error.message,
        stack: error.stack
      });
      
      // Sair gracefully
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM recebido, iniciando shutdown graceful...');
      
      try {
        this.stopAutomaticDataCollection();
        await databaseService.disconnect();
        await redisService.disconnect();
        logger.info('Conexões fechadas com sucesso');
      } catch (error) {
        logger.error('Erro durante shutdown:', error);
      }
      
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT recebido, iniciando shutdown graceful...');
      
      try {
        this.stopAutomaticDataCollection();
        await databaseService.disconnect();
        await redisService.disconnect();
        logger.info('Conexões fechadas com sucesso');
      } catch (error) {
        logger.error('Erro durante shutdown:', error);
      }
      
      process.exit(0);
    });
  }

  /**
   * Coleta automática de dados da API OpenWeather
   */
  private automaticCollectionInterval: NodeJS.Timeout | null = null;

  private async collectWeatherData(): Promise<void> {
    try {
      logger.info('Iniciando coleta automática de dados meteorológicos');
      
      const cities = await databaseService.getCidades();
      let successCount = 0;
      let errorCount = 0;

      for (const city of cities) {
        try {
          const weatherData = await openWeatherService.getCurrentWeather(city.openweather_id);
          
          await databaseService.insertTemperature({
            cidade_id: city.id,
            temperatura: weatherData.main.temp,
            sensacao_termica: weatherData.main.feels_like,
            umidade: weatherData.main.humidity,
            pressao: weatherData.main.pressure,
            descricao_tempo: weatherData.weather[0]?.description || '',
            velocidade_vento: weatherData.wind?.speed || 0,
            direcao_vento: weatherData.wind?.deg || 0,
            fonte: 'OpenWeather API (Automático)'
          });

          successCount++;
          logger.debug(`Dados coletados automaticamente para ${city.nome}: ${weatherData.main.temp}°C`);
          
          // Pequeno delay entre requisições para respeitar rate limit
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          errorCount++;
          logger.error(`Erro na coleta automática para ${city.nome}:`, error);
        }
      }

      // Limpar cache após coleta bem-sucedida
      if (successCount > 0) {
        await redisService.del('temperaturas:atuais:all');
      }

      logger.info(`Coleta automática finalizada: ${successCount} sucessos, ${errorCount} erros`);
      
    } catch (error) {
      logger.error('Erro na coleta automática de dados:', error);
    }
  }

  private startAutomaticDataCollection(): void {
    // Coletando dados a cada 15 minutos
    const intervalMinutes = 15;
    const intervalMs = intervalMinutes * 60 * 1000;
    
    logger.info(`Iniciando coleta automática de dados a cada ${intervalMinutes} minutos`);
    
    // Primeira coleta imediata após 30 segundos
    setTimeout(async () => {
      await this.collectWeatherData();
    }, 30000);
    
    // Coleta periódica
    this.automaticCollectionInterval = setInterval(async () => {
      await this.collectWeatherData();
    }, intervalMs);
  }

  private stopAutomaticDataCollection(): void {
    if (this.automaticCollectionInterval) {
      clearInterval(this.automaticCollectionInterval);
      this.automaticCollectionInterval = null;
      logger.info('Coleta automática de dados interrompida');
    }
  }

  public async initialize(): Promise<void> {
    try {
      // Conectar ao banco de dados
      await databaseService.connect();
      logger.info('Conexão com PostgreSQL estabelecida com sucesso');

      // Conectar ao Redis
      try {
        await redisService.connect();
        logger.info('Conexão com Redis estabelecida com sucesso');
      } catch (error) {
        logger.error('Erro ao conectar com Redis:', error);
        logger.warn('Sistema continuará sem cache Redis');
      }

      // Testar conectividade com OpenWeather API
      try {
        const isApiConnected = await openWeatherService.testConnection();
        if (isApiConnected) {
          logger.info('Conectividade com OpenWeather API verificada');
          // Iniciar coleta automática apenas se API estiver funcionando
          this.startAutomaticDataCollection();
        } else {
          logger.warn('API OpenWeather não está respondendo - coleta automática desabilitada');
        }
      } catch (error) {
        logger.error('Erro ao testar conectividade com OpenWeather API:', error);
      }

      logger.info('Aplicação inicializada com sucesso');
    } catch (error) {
      logger.error('Falha ao inicializar aplicação:', error);
      throw error;
    }
  }
}

export default new App();
