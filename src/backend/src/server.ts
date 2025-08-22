/**
 * Sistema de Monitoramento de Temperatura - Server Entry Point
 * Subagente: Backend Developer (Node.js, Express, TypeScript)
 * Data: 19/08/2025
 */

import app from './app';
import { config } from './config/environment';
import { logger } from './utils/logger';

const PORT = config.port || 3000;

async function startServer(): Promise<void> {
  try {
    // Inicializar a aplicação
    await app.initialize();

    // Iniciar o servidor HTTP
    const server = app.app.listen(PORT, () => {
      logger.info(`Servidor iniciado com sucesso`, {
        port: PORT,
        environment: config.nodeEnv,
        processId: process.pid,
        timestamp: new Date().toISOString()
      });

      logger.info(`API disponível em: http://localhost:${PORT}`);
      logger.info(`Documentação disponível em: http://localhost:${PORT}/api/v1`);
      logger.info(`Health check disponível em: http://localhost:${PORT}/health`);
    });

    // Configurar timeout do servidor
    server.timeout = 30000; // 30 segundos

    // Configurar keep-alive
    server.keepAliveTimeout = 61000; // 61 segundos
    server.headersTimeout = 62000; // 62 segundos

    // Manipuladores de sinal para shutdown graceful
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM recebido. Iniciando shutdown graceful...');
      server.close(() => {
        logger.info('Servidor HTTP fechado');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT recebido. Iniciando shutdown graceful...');
      server.close(() => {
        logger.info('Servidor HTTP fechado');
        process.exit(0);
      });
    });

    // Manipular erros não capturados
    process.on('uncaughtException', (error: Error) => {
      logger.error('Exceção não capturada:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      // Fechar servidor gracefully
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Promise rejeitada não tratada:', {
        reason: reason?.message || reason,
        stack: reason?.stack,
        timestamp: new Date().toISOString()
      });
      
      // Em desenvolvimento, apenas logar. Em produção, considerar fechar
      if (config.nodeEnv === 'production') {
        server.close(() => {
          process.exit(1);
        });
      }
    });

  } catch (error) {
    logger.error('Falha ao iniciar servidor:', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  }
}

// Verificar se está sendo executado diretamente
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Erro fatal no servidor:', error);
    process.exit(1);
  });
}

export { app };
export default startServer;
