import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Bell,
  Clock,
  MapPin,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wind
} from 'lucide-react';
import { apiClient } from '../services/api';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorDisplay } from './ui/ErrorDisplay';
import { formatRelativeDate } from '../utils/formatters';

// Local interfaces for API responses
interface Alert {
  id: number;
  tipo_alerta: string;
  valor_disparador: number;
  valor_limite: number;
  mensagem: string;
  data_hora: string;
  notificado: boolean;
  cidade: {
    id: number;
    nome: string;
    estado: string;
  } | null;
  temperatura_registro?: number;
}

interface AlertConfig {
  cidade: {
    id: number;
    nome: string;
    estado: string;
  };
  alertas: Array<{
    id: number;
    tipo_alerta: string;
    valor_minimo: number | null;
    valor_maximo: number | null;
    ativo: boolean;
    email_notificacao: string | null;
  }>;
}

interface AlertStats {
  periodo_24h: number;
  periodo_7d: number;
  periodo_30d: number;
  por_tipo: Array<{
    tipo_alerta: string;
    quantidade: number;
  }>;
  por_cidade: Array<{
    cidade: string;
    estado: string;
    quantidade: number;
  }>;
  ultimo_alerta: string | null;
}

const AlertComponent = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<'recent' | 'configs'>('recent');

  const loadAlertsData = async () => {
    try {
      setError(null);
      
      const [recentResponse, configsResponse, statsResponse] = await Promise.all([
        apiClient.request<Alert[]>('GET', '/alertas/recentes?limit=20'),
        apiClient.request<AlertConfig[]>('GET', '/alertas/configs'),
        apiClient.request<AlertStats>('GET', '/alertas/estatisticas')
      ]);

      if (recentResponse.success) {
        setAlerts(recentResponse.data);
      }

      if (configsResponse.success) {
        setConfigs(configsResponse.data);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

    } catch (err: any) {
      console.error('Erro ao carregar dados de alertas:', err);
      setError(err.message || 'Erro ao carregar dados de alertas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlertsData();
  };

  useEffect(() => {
    loadAlertsData();
  }, []);

  const getAlertIcon = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'temperatura_alta':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'temperatura_baixa':
        return <TrendingDown className="h-4 w-4 text-blue-500" />;
      case 'umidade_alta':
      case 'umidade_baixa':
        return <Wind className="h-4 w-4 text-cyan-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getAlertColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'temperatura_alta':
        return 'border-red-200 bg-red-50';
      case 'temperatura_baixa':
        return 'border-blue-200 bg-blue-50';
      case 'umidade_alta':
      case 'umidade_baixa':
        return 'border-cyan-200 bg-cyan-50';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSpinner text="Carregando alertas..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={loadAlertsData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Sistema de Alertas
          </h2>
          <p className="text-slate-600">
            Monitoramento de condições extremas de temperatura e umidade
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Alertas 24h</p>
                <p className="text-2xl font-bold text-slate-900">{stats.periodo_24h}</p>
              </div>
              <Bell className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Alertas 7d</p>
                <p className="text-2xl font-bold text-slate-900">{stats.periodo_7d}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Alertas 30d</p>
                <p className="text-2xl font-bold text-slate-900">{stats.periodo_30d}</p>
              </div>
              <Bell className="h-8 w-8 text-slate-500" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
        <button
          onClick={() => setActiveView('recent')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'recent'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Alertas Recentes</span>
        </button>
        
        <button
          onClick={() => setActiveView('configs')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'configs'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Configurações</span>
        </button>
      </div>

      {/* Content */}
      {activeView === 'recent' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900">
            Alertas Disparados ({alerts.length})
          </h3>
          
          {alerts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">Nenhum alerta recente</p>
              <p className="text-slate-400 text-sm mt-2">
                Os alertas aparecerão aqui quando as condições extremas forem detectadas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${getAlertColor(alert.tipo_alerta)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getAlertIcon(alert.tipo_alerta)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-slate-900">
                            {alert.mensagem}
                          </h4>
                          
                          {alert.cidade && (
                            <div className="flex items-center space-x-1 mt-1 text-xs text-slate-600">
                              <MapPin className="h-3 w-3" />
                              <span>{alert.cidade.nome}, {alert.cidade.estado}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                            <span>
                              Valor: {alert.valor_disparador}°C
                            </span>
                            <span>
                              Limite: {alert.valor_limite}°C
                            </span>
                            <span>
                              {formatRelativeDate(alert.data_hora)}
                            </span>
                          </div>
                        </div>
                        
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          alert.notificado 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {alert.notificado ? 'Notificado' : 'Pendente'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'configs' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900">
            Configurações de Alertas
          </h3>
          
          {configs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">Nenhuma configuração encontrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {configs.map((config) => (
                <div key={config.cidade.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <h4 className="text-lg font-medium text-slate-900">
                      {config.cidade.nome}, {config.cidade.estado}
                    </h4>
                  </div>
                  
                  <div className="space-y-3">
                    {config.alertas.map((alerta) => (
                      <div 
                        key={alerta.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          {getAlertIcon(alerta.tipo_alerta)}
                          <span className="text-sm font-medium text-slate-700">
                            {alerta.tipo_alerta.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="text-sm text-slate-600">
                          {alerta.valor_minimo && (
                            <span>Min: {alerta.valor_minimo}°C </span>
                          )}
                          {alerta.valor_maximo && (
                            <span>Max: {alerta.valor_maximo}°C</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AlertComponent;
export { AlertsPanel };
