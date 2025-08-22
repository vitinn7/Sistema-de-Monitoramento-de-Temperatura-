/**
 * Alert Service
 * Sistema de Monitoramento de Temperatura
 * Subagente: Backend Developer (Node.js, Express, TypeScript)
 */

import nodemailer from 'nodemailer';
import axios from 'axios';
import { config } from '../config/environment';
import { logger, logError, logAlert } from '../utils/logger';
import { databaseService, AlertaConfig, Cidade } from './database.service';

export interface AlertData {
  cidade: Cidade;
  temperatura: number;
  sensacaoTermica: number;
  alertConfig: AlertaConfig;
  alertType: 'TEMPERATURA_ALTA' | 'TEMPERATURA_BAIXA';
  timestamp: Date;
}

export interface EmailAlert {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface WebhookAlert {
  url: string;
  payload: {
    alertType: string;
    city: string;
    temperature: number;
    threshold: number;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
  };
}

export class AlertService {
  private emailTransporter: nodemailer.Transporter | null = null;
  private isEmailConfigured: boolean = false;

  constructor() {
    this.setupEmailTransporter();
  }

  /**
   * Setup email transporter with SMTP configuration
   */
  private setupEmailTransporter(): void {
    try {
      if (!config.alerts.emailHost || !config.alerts.emailFrom) {
        logger.warn('Email alerts not configured - missing host or from address');
        return;
      }

      this.emailTransporter = nodemailer.createTransport({
        host: config.alerts.emailHost,
        port: config.alerts.emailPort,
        secure: config.alerts.emailPort === 465, // true for 465, false for other ports
        auth: config.alerts.emailUser && config.alerts.emailPass ? {
          user: config.alerts.emailUser,
          pass: config.alerts.emailPass,
        } : undefined,
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates in development
        }
      });

      this.isEmailConfigured = true;
      logger.info('Email transporter configured successfully', {
        host: config.alerts.emailHost,
        port: config.alerts.emailPort,
        secure: config.alerts.emailPort === 465
      });
    } catch (error) {
      logError(new Error('Failed to setup email transporter'), {
        error: (error as Error).message
      });
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConnection(): Promise<boolean> {
    if (!this.emailTransporter) {
      return false;
    }

    try {
      await this.emailTransporter.verify();
      logger.info('Email connection test successful');
      return true;
    } catch (error) {
      logError(new Error('Email connection test failed'), {
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Process temperature reading and check for alerts
   */
  async processTemperatureAlert(
    cidade: Cidade,
    temperatura: number,
    sensacaoTermica: number
  ): Promise<void> {
    try {
      // Get alert configurations for this city
      const alertConfigs = await databaseService.getAlertConfigsByCidade(cidade.id);
      
      if (alertConfigs.length === 0) {
        logger.debug('No alert configurations found for city', { city: cidade.nome });
        return;
      }

      // Check each alert configuration
      for (const alertConfig of alertConfigs) {
        await this.checkAndTriggerAlert(cidade, temperatura, sensacaoTermica, alertConfig);
      }
    } catch (error) {
      logError(new Error('Failed to process temperature alerts'), {
        cidade: cidade.nome,
        temperatura,
        error: (error as Error).message
      });
    }
  }

  /**
   * Check if alert should be triggered and trigger it
   */
  private async checkAndTriggerAlert(
    cidade: Cidade,
    temperatura: number,
    sensacaoTermica: number,
    alertConfig: AlertaConfig
  ): Promise<void> {
    let shouldAlert = false;
    let alertType: 'TEMPERATURA_ALTA' | 'TEMPERATURA_BAIXA' | null = null;
    let threshold = 0;

    // Check high temperature alert
    if (alertConfig.valor_maximo && temperatura >= alertConfig.valor_maximo) {
      shouldAlert = true;
      alertType = 'TEMPERATURA_ALTA';
      threshold = alertConfig.valor_maximo;
    }

    // Check low temperature alert
    if (alertConfig.valor_minimo && temperatura <= alertConfig.valor_minimo) {
      shouldAlert = true;
      alertType = 'TEMPERATURA_BAIXA';
      threshold = alertConfig.valor_minimo;
    }

    if (!shouldAlert || !alertType) {
      return;
    }

    const alertData: AlertData = {
      cidade,
      temperatura,
      sensacaoTermica,
      alertConfig,
      alertType,
      timestamp: new Date()
    };

    logAlert(alertType, cidade.nome, temperatura, threshold);

    // Send alerts
    await this.sendAlert(alertData);
  }

  /**
   * Send alert via configured channels
   */
  private async sendAlert(alertData: AlertData): Promise<void> {
    const promises: Promise<any>[] = [];

    // Send email alert if configured
    if (alertData.alertConfig.email_notificacao && this.isEmailConfigured) {
      promises.push(this.sendEmailAlert(alertData));
    }

    // Send webhook alert if configured
    if (alertData.alertConfig.webhook_url) {
      promises.push(this.sendWebhookAlert(alertData));
    }

    // Execute all alerts in parallel
    const results = await Promise.allSettled(promises);
    
    // Log results
    let successCount = 0;
    let errorCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        errorCount++;
        logError(new Error('Alert sending failed'), {
          alertType: alertData.alertType,
          cidade: alertData.cidade.nome,
          channel: index === 0 ? 'email' : 'webhook',
          error: result.reason
        });
      }
    });

    logger.info('Alert sending completed', {
      alertType: alertData.alertType,
      cidade: alertData.cidade.nome,
      temperatura: alertData.temperatura,
      successful: successCount,
      failed: errorCount
    });
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alertData: AlertData): Promise<void> {
    if (!this.emailTransporter || !alertData.alertConfig.email_notificacao) {
      throw new Error('Email not configured or no destination email');
    }

    const emailContent = this.generateEmailContent(alertData);
    
    try {
      const info = await this.emailTransporter.sendMail({
        from: config.alerts.emailFrom,
        to: alertData.alertConfig.email_notificacao,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      });

      logger.info('Email alert sent successfully', {
        messageId: info.messageId,
        to: alertData.alertConfig.email_notificacao,
        ciudad: alertData.cidade.nome,
        alertType: alertData.alertType
      });
    } catch (error) {
      logError(new Error('Failed to send email alert'), {
        to: alertData.alertConfig.email_notificacao,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alertData: AlertData): Promise<void> {
    if (!alertData.alertConfig.webhook_url) {
      throw new Error('No webhook URL configured');
    }

    const webhookData = this.generateWebhookPayload(alertData);

    try {
      const response = await axios.post(
        alertData.alertConfig.webhook_url,
        webhookData.payload,
        {
          timeout: config.alerts.webhookTimeout,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'TemperatureMonitoringSystem/1.0'
          }
        }
      );

      logger.info('Webhook alert sent successfully', {
        url: alertData.alertConfig.webhook_url,
        status: response.status,
        cidade: alertData.cidade.nome,
        alertType: alertData.alertType
      });
    } catch (error) {
      logError(new Error('Failed to send webhook alert'), {
        url: alertData.alertConfig.webhook_url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate email content for alert
   */
  private generateEmailContent(alertData: AlertData): EmailAlert {
    const { cidade, temperatura, sensacaoTermica, alertType, timestamp, alertConfig } = alertData;
    
    const tempText = alertType === 'TEMPERATURA_ALTA' ? 'alta' : 'baixa';
    const threshold = alertType === 'TEMPERATURA_ALTA' 
      ? alertConfig.valor_maximo 
      : alertConfig.valor_minimo;
    
    const subject = `🌡️ Alerta de Temperatura ${tempText.charAt(0).toUpperCase() + tempText.slice(1)} - ${cidade.nome}`;
    
    const text = `
ALERTA DE TEMPERATURA ${tempText.toUpperCase()}

Cidade: ${cidade.nome}, ${cidade.estado}
Temperatura atual: ${temperatura}°C
Sensação térmica: ${sensacaoTermica}°C
Limite configurado: ${threshold}°C
Data/Hora: ${timestamp.toLocaleString('pt-BR')}

Este é um alerta automático do Sistema de Monitoramento de Temperatura.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .alert { background-color: ${alertType === 'TEMPERATURA_ALTA' ? '#fff3cd' : '#d1ecf1'}; 
                 border: 1px solid ${alertType === 'TEMPERATURA_ALTA' ? '#ffeaa7' : '#bee5eb'}; 
                 padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .temperature { font-size: 24px; font-weight: bold; color: ${alertType === 'TEMPERATURA_ALTA' ? '#e17055' : '#0984e3'}; }
        .details { margin-top: 15px; }
        .footer { margin-top: 20px; font-size: 12px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="alert">
        <h2>🌡️ Alerta de Temperatura ${tempText.charAt(0).toUpperCase() + tempText.slice(1)}</h2>
        <p><strong>Cidade:</strong> ${cidade.nome}, ${cidade.estado}</p>
        <div class="temperature">Temperatura atual: ${temperatura}°C</div>
        <div class="details">
            <p><strong>Sensação térmica:</strong> ${sensacaoTermica}°C</p>
            <p><strong>Limite configurado:</strong> ${threshold}°C</p>
            <p><strong>Data/Hora:</strong> ${timestamp.toLocaleString('pt-BR')}</p>
        </div>
    </div>
    <div class="footer">
        <p>Este é um alerta automático do Sistema de Monitoramento de Temperatura.</p>
    </div>
</body>
</html>
    `.trim();

    return { to: alertData.alertConfig.email_notificacao!, subject, text, html };
  }

  /**
   * Generate webhook payload for alert
   */
  private generateWebhookPayload(alertData: AlertData): WebhookAlert {
    const { cidade, temperatura, alertType, timestamp, alertConfig } = alertData;
    
    const threshold = alertType === 'TEMPERATURA_ALTA' 
      ? alertConfig.valor_maximo! 
      : alertConfig.valor_minimo!;

    // Determine severity based on how far the temperature is from the threshold
    let severity: 'low' | 'medium' | 'high' = 'medium';
    const difference = Math.abs(temperatura - threshold);
    
    if (difference >= 10) {
      severity = 'high';
    } else if (difference <= 3) {
      severity = 'low';
    }

    return {
      url: alertData.alertConfig.webhook_url!,
      payload: {
        alertType,
        city: `${cidade.nome}, ${cidade.estado}`,
        temperature: temperatura,
        threshold,
        timestamp: timestamp.toISOString(),
        severity
      }
    };
  }

  /**
   * Get alert service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    emailConfigured: boolean;
    emailConnectionHealthy: boolean;
  }> {
    const emailHealthy = this.isEmailConfigured ? await this.testEmailConnection() : false;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (!this.isEmailConfigured) {
      status = 'degraded'; // Can still send webhooks
    } else if (!emailHealthy) {
      status = 'unhealthy';
    }

    return {
      status,
      emailConfigured: this.isEmailConfigured,
      emailConnectionHealthy: emailHealthy
    };
  }

  /**
   * Test alert by sending a test notification
   */
  async sendTestAlert(
    cidade: Cidade,
    email?: string,
    webhookUrl?: string
  ): Promise<{ email: boolean; webhook: boolean }> {
    const testAlertData: AlertData = {
      cidade,
      temperatura: 35.5,
      sensacaoTermica: 38.2,
      alertConfig: {
        id: 0,
        cidade_id: cidade.id,
        tipo_alerta: 'TEMPERATURA',
        valor_maximo: 35,
        ativo: true,
        email_notificacao: email,
        webhook_url: webhookUrl || '',
        data_criacao: new Date()
      },
      alertType: 'TEMPERATURA_ALTA',
      timestamp: new Date()
    };

    const results = { email: false, webhook: false };

    // Test email
    if (email && this.isEmailConfigured) {
      try {
        await this.sendEmailAlert(testAlertData);
        results.email = true;
      } catch (error) {
        logger.warn('Test email alert failed', { error: (error as Error).message });
      }
    }

    // Test webhook
    if (webhookUrl) {
      try {
        await this.sendWebhookAlert(testAlertData);
        results.webhook = true;
      } catch (error) {
        logger.warn('Test webhook alert failed', { error: (error as Error).message });
      }
    }

    return results;
  }
}

// Export singleton instance
export const alertService = new AlertService();
