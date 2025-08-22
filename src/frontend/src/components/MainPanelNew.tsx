import { useState } from 'react';
import { 
  RefreshCw, 
  MapPin, 
  Thermometer, 
  Activity,
  AlertTriangle,
  TrendingUp,
  Bell
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TemperatureCard } from './TemperatureCard';
import AlertsDashboard from './AlertsPanel';
import { TemperatureCharts } from './TemperatureCharts';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorDisplay } from './ui/ErrorDisplay';

// Helper function to safely format temperature values from statistics
const formatStatTemperature = (value: any): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '---';
  }
  return `${Number(value).toFixed(1)}°C`;
};

// Helper function to safely format numbers
const formatStatNumber = (value: any): string => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '---';
  }
  return Number(value).toLocaleString();
};

export const MainPanel: React.FC = () => {
  const { 
    cidades, 
    temperaturasAtuais, 
    estatisticas, 
    loading, 
    refreshData 
  } = useApp();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'charts'>('overview');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  };

  // Combine cities with current temperatures
  const cidadesComTemperatura = cidades.map(cidade => {
    const temperaturaAtual = temperaturasAtuais.find(temp => temp.cidade_id === cidade.id);
    return {
      ...cidade,
      temperatura_atual: temperaturaAtual,
      ultima_atualizacao: temperaturaAtual?.data_hora
    };
  });

  if (loading.isLoading && !refreshing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (loading.error && temperaturasAtuais.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full">
          <ErrorDisplay 
            error={loading.error} 
            onRetry={refreshData}
          />
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'alerts':
        return <AlertsDashboard />;
      case 'charts':
        return <TemperatureCharts />;
      default:
        return (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Cidades Ativas</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatStatNumber(estatisticas?.cidades_ativas)}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Temp. Média (1h)</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatStatTemperature(estatisticas?.temp_media_1h)}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Thermometer className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Registros (24h)</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatStatNumber(estatisticas?.temperaturas_24h)}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Alertas (24h)</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatStatNumber(estatisticas?.alertas_24h)}
                    </p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Temperature Cards */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Temperaturas Atuais
                </h2>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Atualizando...' : 'Atualizar'}
                </button>
              </div>

              {cidadesComTemperatura.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Nenhuma cidade encontrada
                  </h3>
                  <p className="text-slate-500">
                    Verifique se as cidades estão ativas e com coleta de dados funcionando
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cidadesComTemperatura.map((cidade) => (
                    <TemperatureCard 
                      key={cidade.id} 
                      cidade={cidade}
                      loading={refreshing}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Status Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Status do Sistema
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <p className="text-sm font-medium text-slate-900">Sistema Online</p>
                  <p className="text-xs text-slate-500">Operando normalmente</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-2">
                    <Activity className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {formatStatNumber(estatisticas?.temperaturas_24h)} Coletas
                  </p>
                  <p className="text-xs text-slate-500">Últimas 24 horas</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-2">
                    <TrendingUp className="h-6 w-6 text-purple-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {formatStatTemperature(estatisticas?.temp_max_1h)} Max
                  </p>
                  <p className="text-xs text-slate-500">Última hora</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Sistema de Monitoramento Meteorológico
              </h1>
              <p className="text-slate-600">
                Dashboard em tempo real de temperaturas e alertas climáticos
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 mb-1">
                Última atualização: {estatisticas?.timestamp ? 
                  new Date(estatisticas.timestamp).toLocaleString('pt-BR') : 
                  'Carregando...'
                }
              </p>
              <div className="inline-flex items-center text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Sistema Online
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-4 w-4" />
                  <span>Visão Geral</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('alerts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'alerts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span>Alertas</span>
                  {estatisticas?.alertas_24h && estatisticas.alertas_24h > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {estatisticas.alertas_24h}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab('charts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'charts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Gráficos</span>
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPanel;
