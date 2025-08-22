// AlertsPanel Logic Tests
import { describe, it, expect } from 'vitest';

describe('AlertsPanel Logic', () => {
  describe('Alert Generation Logic', () => {
    it('should generate high temperature alerts correctly', () => {
      const temperatureData = [
        { id: 1, cidade_nome: 'São Paulo', temperatura: 38, data_hora: new Date() },
        { id: 2, cidade_nome: 'Rio de Janeiro', temperatura: 42, data_hora: new Date() },
        { id: 3, cidade_nome: 'Brasília', temperatura: 25, data_hora: new Date() }
      ];

      const generateHighTempAlerts = (data: typeof temperatureData, threshold = 35) => {
        return data
          .filter(item => item.temperatura > threshold)
          .map(item => ({
            id: item.id,
            cidade: item.cidade_nome,
            temperatura: item.temperatura,
            tipo: 'alta_temperatura',
            severidade: item.temperatura > 40 ? 'crítica' : 'alta',
            mensagem: `Temperatura alta em ${item.cidade_nome}: ${item.temperatura}°C`,
            data_hora: item.data_hora
          }));
      };

      const alerts = generateHighTempAlerts(temperatureData);
      
      expect(alerts).toHaveLength(2);
      expect(alerts[0].cidade).toBe('São Paulo');
      expect(alerts[0].severidade).toBe('alta');
      expect(alerts[1].cidade).toBe('Rio de Janeiro');
      expect(alerts[1].severidade).toBe('crítica');
    });

    it('should generate low temperature alerts correctly', () => {
      const temperatureData = [
        { id: 1, cidade_nome: 'São Paulo', temperatura: 2, data_hora: new Date() },
        { id: 2, cidade_nome: 'Rio de Janeiro', temperatura: 15, data_hora: new Date() },
        { id: 3, cidade_nome: 'Brasília', temperatura: -2, data_hora: new Date() }
      ];

      const generateLowTempAlerts = (data: typeof temperatureData, threshold = 5) => {
        return data
          .filter(item => item.temperatura < threshold)
          .map(item => ({
            id: item.id,
            cidade: item.cidade_nome,
            temperatura: item.temperatura,
            tipo: 'baixa_temperatura',
            severidade: item.temperatura < 0 ? 'crítica' : 'alta',
            mensagem: `Temperatura baixa em ${item.cidade_nome}: ${item.temperatura}°C`,
            data_hora: item.data_hora
          }));
      };

      const alerts = generateLowTempAlerts(temperatureData);
      
      expect(alerts).toHaveLength(2);
      expect(alerts[0].cidade).toBe('São Paulo');
      expect(alerts[0].severidade).toBe('alta');
      expect(alerts[1].cidade).toBe('Brasília');
      expect(alerts[1].severidade).toBe('crítica');
    });
  });

  describe('Alert Severity Logic', () => {
    it('should determine alert severity correctly', () => {
      const determineTemperatureSeverity = (temperatura: number, tipo: 'alta' | 'baixa') => {
        if (tipo === 'alta') {
          if (temperatura >= 45) return 'emergência';
          if (temperatura >= 40) return 'crítica';
          if (temperatura >= 35) return 'alta';
          return 'média';
        } else {
          if (temperatura <= -10) return 'emergência';
          if (temperatura <= 0) return 'crítica';
          if (temperatura <= 5) return 'alta';
          return 'média';
        }
      };

      // High temperature severity
      expect(determineTemperatureSeverity(46, 'alta')).toBe('emergência');
      expect(determineTemperatureSeverity(42, 'alta')).toBe('crítica');
      expect(determineTemperatureSeverity(37, 'alta')).toBe('alta');
      expect(determineTemperatureSeverity(30, 'alta')).toBe('média');

      // Low temperature severity
      expect(determineTemperatureSeverity(-15, 'baixa')).toBe('emergência');
      expect(determineTemperatureSeverity(-2, 'baixa')).toBe('crítica');
      expect(determineTemperatureSeverity(3, 'baixa')).toBe('alta');
      expect(determineTemperatureSeverity(8, 'baixa')).toBe('média');
    });

    it('should assign correct colors to alert severities', () => {
      const getSeverityColor = (severidade: string) => {
        const colors = {
          'emergência': 'bg-purple-600 text-white border-purple-700',
          'crítica': 'bg-red-600 text-white border-red-700',
          'alta': 'bg-orange-500 text-white border-orange-600',
          'média': 'bg-yellow-400 text-black border-yellow-500',
          'baixa': 'bg-blue-400 text-white border-blue-500'
        };
        
        return colors[severidade as keyof typeof colors] || 'bg-gray-400 text-black border-gray-500';
      };

      expect(getSeverityColor('emergência')).toContain('purple');
      expect(getSeverityColor('crítica')).toContain('red');
      expect(getSeverityColor('alta')).toContain('orange');
      expect(getSeverityColor('média')).toContain('yellow');
      expect(getSeverityColor('baixa')).toContain('blue');
      expect(getSeverityColor('desconhecida')).toContain('gray');
    });
  });

  describe('Alert Filtering Logic', () => {
    const mockAlerts = [
      { id: 1, tipo: 'alta_temperatura', severidade: 'crítica', cidade: 'São Paulo' },
      { id: 2, tipo: 'baixa_temperatura', severidade: 'alta', cidade: 'Rio de Janeiro' },
      { id: 3, tipo: 'alta_temperatura', severidade: 'média', cidade: 'Brasília' },
      { id: 4, tipo: 'baixa_temperatura', severidade: 'crítica', cidade: 'Salvador' }
    ];

    it('should filter alerts by severity', () => {
      const filterBySeverity = (alerts: typeof mockAlerts, severidade: string) => {
        return severidade === 'todas' 
          ? alerts 
          : alerts.filter(alert => alert.severidade === severidade);
      };

      const criticalAlerts = filterBySeverity(mockAlerts, 'crítica');
      expect(criticalAlerts).toHaveLength(2);
      expect(criticalAlerts.every(alert => alert.severidade === 'crítica')).toBe(true);

      const allAlerts = filterBySeverity(mockAlerts, 'todas');
      expect(allAlerts).toHaveLength(4);
    });

    it('should filter alerts by type', () => {
      const filterByType = (alerts: typeof mockAlerts, tipo: string) => {
        return tipo === 'todos' 
          ? alerts 
          : alerts.filter(alert => alert.tipo === tipo);
      };

      const highTempAlerts = filterByType(mockAlerts, 'alta_temperatura');
      expect(highTempAlerts).toHaveLength(2);
      expect(highTempAlerts.every(alert => alert.tipo === 'alta_temperatura')).toBe(true);

      const lowTempAlerts = filterByType(mockAlerts, 'baixa_temperatura');
      expect(lowTempAlerts).toHaveLength(2);
    });

    it('should filter alerts by city', () => {
      const filterByCity = (alerts: typeof mockAlerts, cidade: string) => {
        return cidade === 'todas' 
          ? alerts 
          : alerts.filter(alert => alert.cidade === cidade);
      };

      const spAlerts = filterByCity(mockAlerts, 'São Paulo');
      expect(spAlerts).toHaveLength(1);
      expect(spAlerts[0].cidade).toBe('São Paulo');

      const allCities = filterByCity(mockAlerts, 'todas');
      expect(allCities).toHaveLength(4);
    });
  });

  describe('Alert Sorting Logic', () => {
    const mockAlertsWithDate = [
      { 
        id: 1, 
        severidade: 'média', 
        data_hora: new Date('2024-01-15T10:00:00'),
        temperatura: 36
      },
      { 
        id: 2, 
        severidade: 'crítica', 
        data_hora: new Date('2024-01-15T12:00:00'),
        temperatura: 42
      },
      { 
        id: 3, 
        severidade: 'alta', 
        data_hora: new Date('2024-01-15T11:00:00'),
        temperatura: 38
      }
    ];

    it('should sort alerts by severity priority', () => {
      const getSeverityPriority = (severidade: string) => {
        const priorities = {
          'emergência': 5,
          'crítica': 4,
          'alta': 3,
          'média': 2,
          'baixa': 1
        };
        return priorities[severidade as keyof typeof priorities] || 0;
      };

      const sortedBySeverity = [...mockAlertsWithDate].sort((a, b) => 
        getSeverityPriority(b.severidade) - getSeverityPriority(a.severidade)
      );

      expect(sortedBySeverity[0].severidade).toBe('crítica');
      expect(sortedBySeverity[1].severidade).toBe('alta');
      expect(sortedBySeverity[2].severidade).toBe('média');
    });

    it('should sort alerts by datetime (most recent first)', () => {
      const sortedByDate = [...mockAlertsWithDate].sort((a, b) => 
        b.data_hora.getTime() - a.data_hora.getTime()
      );

      expect(sortedByDate[0].data_hora.getHours()).toBe(12);
      expect(sortedByDate[1].data_hora.getHours()).toBe(11);
      expect(sortedByDate[2].data_hora.getHours()).toBe(10);
    });

    it('should sort alerts by temperature value', () => {
      const sortedByTemp = [...mockAlertsWithDate].sort((a, b) => 
        b.temperatura - a.temperatura
      );

      expect(sortedByTemp[0].temperatura).toBe(42);
      expect(sortedByTemp[1].temperatura).toBe(38);
      expect(sortedByTemp[2].temperatura).toBe(36);
    });
  });

  describe('Alert Statistics Logic', () => {
    const mockAlerts = [
      { severidade: 'crítica', tipo: 'alta_temperatura' },
      { severidade: 'crítica', tipo: 'baixa_temperatura' },
      { severidade: 'alta', tipo: 'alta_temperatura' },
      { severidade: 'alta', tipo: 'alta_temperatura' },
      { severidade: 'média', tipo: 'baixa_temperatura' }
    ];

    it('should calculate alert statistics by severity', () => {
      const getStatsBySeverity = (alerts: typeof mockAlerts) => {
        return alerts.reduce((stats, alert) => {
          stats[alert.severidade] = (stats[alert.severidade] || 0) + 1;
          return stats;
        }, {} as Record<string, number>);
      };

      const stats = getStatsBySeverity(mockAlerts);
      
      expect(stats.crítica).toBe(2);
      expect(stats.alta).toBe(2);
      expect(stats.média).toBe(1);
    });

    it('should calculate alert statistics by type', () => {
      const getStatsByType = (alerts: typeof mockAlerts) => {
        return alerts.reduce((stats, alert) => {
          stats[alert.tipo] = (stats[alert.tipo] || 0) + 1;
          return stats;
        }, {} as Record<string, number>);
      };

      const stats = getStatsByType(mockAlerts);
      
      expect(stats.alta_temperatura).toBe(3);
      expect(stats.baixa_temperatura).toBe(2);
    });

    it('should calculate total alert count', () => {
      const getTotalAlerts = (alerts: typeof mockAlerts) => {
        return alerts.length;
      };

      expect(getTotalAlerts(mockAlerts)).toBe(5);
    });

    it('should calculate percentage distribution', () => {
      const getPercentageDistribution = (alerts: typeof mockAlerts) => {
        const total = alerts.length;
        const severityCount = alerts.reduce((count, alert) => {
          count[alert.severidade] = (count[alert.severidade] || 0) + 1;
          return count;
        }, {} as Record<string, number>);

        return Object.entries(severityCount).reduce((percentages, [severity, count]) => {
          percentages[severity] = Math.round((count / total) * 100);
          return percentages;
        }, {} as Record<string, number>);
      };

      const percentages = getPercentageDistribution(mockAlerts);
      
      expect(percentages.crítica).toBe(40); // 2/5 = 40%
      expect(percentages.alta).toBe(40);    // 2/5 = 40%
      expect(percentages.média).toBe(20);   // 1/5 = 20%
    });
  });

  describe('Alert Message Generation', () => {
    it('should generate appropriate alert messages', () => {
      const generateAlertMessage = (
        cidade: string, 
        temperatura: number, 
        tipo: 'alta' | 'baixa',
        severidade: string
      ) => {
        const tempStr = `${temperatura}°C`;
        const sevStr = severidade === 'crítica' ? 'CRÍTICO' : severidade.toUpperCase();
        
        if (tipo === 'alta') {
          return `[${sevStr}] Temperatura elevada em ${cidade}: ${tempStr}`;
        } else {
          return `[${sevStr}] Temperatura baixa em ${cidade}: ${tempStr}`;
        }
      };

      const highTempMessage = generateAlertMessage('São Paulo', 42, 'alta', 'crítica');
      expect(highTempMessage).toBe('[CRÍTICO] Temperatura elevada em São Paulo: 42°C');

      const lowTempMessage = generateAlertMessage('Curitiba', -2, 'baixa', 'alta');
      expect(lowTempMessage).toBe('[ALTA] Temperatura baixa em Curitiba: -2°C');
    });

    it('should generate alert recommendations', () => {
      const generateRecommendation = (tipo: 'alta' | 'baixa', severidade: string) => {
        if (tipo === 'alta') {
          switch (severidade) {
            case 'emergência':
            case 'crítica':
              return 'Evite exposição ao sol. Mantenha-se hidratado. Procure ambientes climatizados.';
            case 'alta':
              return 'Use protetor solar e roupas leves. Beba bastante água.';
            default:
              return 'Mantenha-se hidratado e evite exercícios intensos ao ar livre.';
          }
        } else {
          switch (severidade) {
            case 'emergência':
            case 'crítica':
              return 'Mantenha-se aquecido. Evite exposição prolongada ao frio. Atenção aos sinais de hipotermia.';
            case 'alta':
              return 'Use roupas adequadas para o frio. Proteja extremidades do corpo.';
            default:
              return 'Vista roupas apropriadas para temperaturas mais baixas.';
          }
        }
      };

      const highTempRec = generateRecommendation('alta', 'crítica');
      expect(highTempRec).toContain('hidratado');
      expect(highTempRec).toContain('climatizados');

      const lowTempRec = generateRecommendation('baixa', 'crítica');
      expect(lowTempRec).toContain('aquecido');
      expect(lowTempRec).toContain('hipotermia');
    });
  });
});
